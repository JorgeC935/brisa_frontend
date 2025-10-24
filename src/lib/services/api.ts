// Cliente HTTP para consumir la API de FastAPI
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  details?: any;
  status: number;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Obtener token del localStorage
    const token = localStorage.getItem('token');
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
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
        const errorData = await response.json().catch(() => ({}));
        throw {
          message: errorData.message || `HTTP Error: ${response.status}`,
          details: errorData,
          status: response.status,
        } as ApiError;
      }

      const data = await response.json();
      return {
        data,
        success: true,
        message: data.message,
      };
    } catch (error) {
      if (error.status) {
        throw error; // Re-throw API errors
      }
      
      // Network or other errors
      throw {
        message: 'Error de conexión. Verifique su conexión a internet.',
        details: error,
        status: 0,
      } as ApiError;
    }
  }

  // Métodos HTTP básicos
  async get<T>(endpoint: string):