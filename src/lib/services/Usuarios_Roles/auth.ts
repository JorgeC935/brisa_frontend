// services/usuarios-y-roles/auth.ts
// Servicio de Autenticación y Gestión de Permisos
import type { LoginRequest, LoginResponse, ApiError } from '../../types/Usuarios_Roles/auth';

const API_URL = 'http://localhost:8000';

class AuthService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  getToken(): string | null {
    return localStorage.getItem('brisa_auth_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Agregar token si existe
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        // El backend devuelve {detail: "mensaje"} en errores
        throw {
          detail: data.detail || data.message || 'Error en la petición',
          status_code: response.status
        } as ApiError;
      }

      return data;
    } catch (error) {
      if ((error as ApiError).detail) {
        throw error;
      }
      throw {
        detail: 'Error de conexión con el servidor',
        status_code: 500
      } as ApiError;
    }
  }

  // ==================== AUTENTICACIÓN ====================
  
  async login(usuario: string, contrasena: string): Promise<LoginResponse> {
    const body = { usuario, password: contrasena };
    return this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async logout(): Promise<any> {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getMe(): Promise<any> {
    return this.request('/api/auth/me', {
      method: 'GET',
    });
  }

  async refreshToken(): Promise<any> {
    return this.request('/api/auth/refresh', {
      method: 'POST',
    });
  }

  // ==================== NUEVOS ENDPOINTS DE PERMISOS ====================

  /**
   * 📋 Obtener permisos detallados del usuario actual
   * Incluye: permisos por módulo, módulos accesibles, acciones disponibles
   * 
   * Endpoint: GET /api/auth/me/permisos
   * 
   * Response:
   * {
   *   success: true,
   *   data: {
   *     usuario: "jperez",
   *     permisos: [{permiso: "Lectura", modulo: "usuarios"}, ...],
   *     permisos_por_modulo: { "usuarios": ["Lectura", "Agregar"], ... },
   *     modulos_accesibles: ["usuarios", "incidentes", ...],
   *     acciones_disponibles: ["ver_usuario", "crear_incidente", ...],
   *     es_administrador: false,
   *     roles: ["Profesor"]
   *   }
   * }
   */
  async getMisPermisos(): Promise<any> {
    return this.request('/api/auth/me/permisos', {
      method: 'GET',
    });
  }

  /**
   * 🔍 Verificar si puede acceder a un módulo específico
   * 
   * Endpoint: GET /api/auth/me/puede-acceder/{modulo}
   * 
   * @param modulo - Nombre del módulo: "usuarios", "incidentes", "esquelas", etc.
   * 
   * Response:
   * {
   *   success: true,
   *   data: {
   *     modulo: "usuarios",
   *     puede_acceder: true,
   *     usuario: "jperez"
   *   }
   * }
   */
  async puedeAccederModulo(modulo: string): Promise<boolean> {
    try {
      const response = await this.request<any>(
        `/api/auth/me/puede-acceder/${modulo}`,
        { method: 'GET' }
      );
      return response.data?.puede_acceder || false;
    } catch (error) {
      console.error(`Error verificando acceso a módulo ${modulo}:`, error);
      return false;
    }
  }

  /**
   * ✅ Verificar si tiene permiso para una acción específica
   * 
   * Endpoint: POST /api/auth/me/verificar-permiso
   * Body: { "accion": "editar_usuario" }
   * 
   * @param accion - Acción a verificar: "editar_usuario", "crear_incidente", etc.
   * 
   * Response:
   * {
   *   success: true,
   *   data: {
   *     accion: "editar_usuario",
   *     tiene_permiso: true,
   *     usuario: "jperez"
   *   }
   * }
   */
  async verificarPermiso(accion: string): Promise<boolean> {
    try {
      const response = await this.request<any>(
        '/api/auth/me/verificar-permiso',
        {
          method: 'POST',
          body: JSON.stringify({ accion })
        }
      );
      return response.data?.tiene_permiso || false;
    } catch (error) {
      console.error(`Error verificando permiso ${accion}:`, error);
      return false;
    }
  }

  // ==================== MÉTODOS GENÉRICOS ====================
  
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Crear instancia
const authServiceInstance = new AuthService(API_URL);

// Exportar objeto plano con todos los métodos bindeados
export const authService = {
  // Métodos de autenticación
  login: authServiceInstance.login.bind(authServiceInstance),
  logout: authServiceInstance.logout.bind(authServiceInstance),
  getMe: authServiceInstance.getMe.bind(authServiceInstance),
  refreshToken: authServiceInstance.refreshToken.bind(authServiceInstance),
  
  // Métodos de permisos
  getMisPermisos: authServiceInstance.getMisPermisos.bind(authServiceInstance),
  puedeAccederModulo: authServiceInstance.puedeAccederModulo.bind(authServiceInstance),
  verificarPermiso: authServiceInstance.verificarPermiso.bind(authServiceInstance),
  
  // Métodos genéricos HTTP
  get: authServiceInstance.get.bind(authServiceInstance),
  post: authServiceInstance.post.bind(authServiceInstance),
  put: authServiceInstance.put.bind(authServiceInstance),
  patch: authServiceInstance.patch.bind(authServiceInstance),
  delete: authServiceInstance.delete.bind(authServiceInstance),
  
  // Utilidades de token
  getToken: authServiceInstance.getToken.bind(authServiceInstance),
};