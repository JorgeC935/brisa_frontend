// Tipos comunes y genéricos
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

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

export interface StandardApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  error_details?: any;
}
