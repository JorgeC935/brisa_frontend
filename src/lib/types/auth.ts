// Autenticación y usuario
export interface LoginRequest {
  usuario: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  usuario_id: number;
  usuario: string;
  nombres: string;
  rol: string;
  permisos: string[];
  expires_in: number;
}

export interface Usuario {
  id_usuario: number;
  id_persona?: number;
  usuario: string;
  correo: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  ci: string;
  telefono?: string;
  direccion?: string;
  tipo_persona?: string;
  roles?: Rol[];
  permisos?: string[];
  estado?: string;
  is_active?: boolean;
}

export interface RegistroUsuarioRequest {
  ci: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  usuario: string;
  correo: string;
  password: string;
  telefono?: string;
  direccion?: string;
  tipo_persona: string;
  id_rol: number;
}

export interface Rol {
  id_rol: number;
  nombre: string;
  descripcion?: string;
  permisos?: Permiso[];
}

export interface Permiso {
  id_permiso: number;
  nombre: string;
  descripcion?: string;
  modulo?: string;
}
