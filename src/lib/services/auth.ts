// Servicio de Autenticación
import type { LoginRequest, LoginResponse, Usuario, StandardApiResponse } from '../types/api.js';

const AUTH_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'brisa_auth_token';
const USER_KEY = 'brisa_user_data';

class AuthService {
  private baseURL: string;

  constructor(baseURL: string = AUTH_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const token = this.getToken();
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token && !endpoint.includes('/login')) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token inválido o expirado
          this.logout();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw {
          message: errorData.message || `HTTP Error: ${response.status}`,
          details: errorData,
          status: response.status,
        };
      }

      const data = await response.json();
      // Manejar estructura de respuesta estándar
      if (data.status === 'success') {
        return data.data || data;
      }
      return data;
    } catch (error: any) {
      if (error.status) {
        throw error;
      }
      
      throw {
        message: 'Error de conexión. Verifique su conexión a internet.',
        details: error,
        status: 0,
      };
    }
  }

  // Gestión de token
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  }

  removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  }

  // Gestión de datos de usuario
  getUserData(): Usuario | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(USER_KEY);
    const userData = data ? JSON.parse(data) : null;
    console.log('📖 getUserData() devuelve:', userData);
    console.log('📖 id_persona en getUserData:', userData?.id_persona);
    return userData;
  }

  setUserData(user: Usuario): void {
    if (typeof window === 'undefined') return;
    console.log('💾 setUserData() guardando:', user);
    console.log('💾 id_persona que se guarda:', user?.id_persona);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  removeUserData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(USER_KEY);
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Verificar permiso
  hasPermission(permission: string): boolean {
    const user = this.getUserData();
    return user?.permisos?.includes(permission) || false;
  }

  // Login
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.makeRequest<StandardApiResponse<LoginResponse>>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );

    const loginData = response.data || response as any;
    
    // Guardar token y datos básicos
    this.setToken(loginData.access_token);
    
    // Obtener datos completos del usuario
    const userData = await this.getCurrentUser();
    
    return loginData;
  }

  // Logout
  async logout(): Promise<void> {
    try {
      if (this.isAuthenticated()) {
        await this.makeRequest('/auth/logout', {
          method: 'POST',
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      this.removeToken();
      this.removeUserData();
    }
  }

  // Obtener usuario actual
  async getCurrentUser(): Promise<Usuario> {
    const response = await this.makeRequest<StandardApiResponse<Usuario>>('/auth/me');
    const userData = response.data || response as any;
    console.log('🔍 Respuesta completa de /auth/me:', response);
    console.log('🔍 userData extraído:', userData);
    console.log('🔍 id_persona en userData:', userData?.id_persona);
    this.setUserData(userData);
    return userData;
  }

  // Refresh token
  async refreshToken(): Promise<LoginResponse> {
    const response = await this.makeRequest<StandardApiResponse<LoginResponse>>(
      '/auth/refresh',
      {
        method: 'POST',
      }
    );
    
    const tokenData = response.data || response as any;
    this.setToken(tokenData.access_token);
    return tokenData;
  }

  // Registro de usuario
  async register(userData: any): Promise<Usuario> {
    const response = await this.makeRequest<StandardApiResponse<Usuario>>(
      '/auth/registro',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );
    return response.data || response as any;
  }

  // Listar usuarios
  async getUsers(skip: number = 0, limit: number = 50): Promise<Usuario[]> {
    const response = await this.makeRequest<StandardApiResponse<Usuario[]>>(
      `/auth/usuarios?skip=${skip}&limit=${limit}`
    );
    return response.data || response as any;
  }

  // Obtener usuario por ID
  async getUser(id: number): Promise<Usuario> {
    const response = await this.makeRequest<StandardApiResponse<Usuario>>(
      `/auth/usuarios/${id}`
    );
    return response.data || response as any;
  }

  // Actualizar usuario
  async updateUser(id: number, userData: Partial<Usuario>): Promise<Usuario> {
    const response = await this.makeRequest<StandardApiResponse<Usuario>>(
      `/auth/usuarios/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(userData),
      }
    );
    return response.data || response as any;
  }

  // Eliminar usuario (borrado lógico)
  async deleteUser(id: number): Promise<void> {
    await this.makeRequest(`/auth/usuarios/${id}`, {
      method: 'DELETE',
    });
  }

  // Listar roles
  async getRoles(skip: number = 0, limit: number = 50): Promise<any[]> {
    const response = await this.makeRequest<StandardApiResponse<any[]>>(
      `/auth/roles?skip=${skip}&limit=${limit}`
    );
    return response.data || response as any;
  }

  // Listar permisos
  async getPermisos(skip: number = 0, limit: number = 100, modulo?: string): Promise<any[]> {
    let url = `/auth/permisos?skip=${skip}&limit=${limit}`;
    if (modulo) url += `&modulo=${modulo}`;
    
    const response = await this.makeRequest<StandardApiResponse<any[]>>(url);
    return response.data || response as any;
  }

  // Asignar rol a usuario
  async assignRoleToUser(userId: number, roleId: number): Promise<void> {
    await this.makeRequest(`/auth/usuarios/${userId}/roles/${roleId}`, {
      method: 'POST',
    });
  }

  // Asignar permisos a rol
  async assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<void> {
    await this.makeRequest(`/auth/roles/${roleId}/permisos`, {
      method: 'POST',
      body: JSON.stringify(permissionIds),
    });
  }
}

export const authService = new AuthService();
