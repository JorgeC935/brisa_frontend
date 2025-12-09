// Personal: profesores y registradores
export interface Profesor {
  id_persona: number;
  ci: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  direccion: string;
  telefono: string;
  correo: string;
  tipo_persona: string;
  nombre_completo: string;
}

export interface Registrador {
  id_persona: number;
  ci: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  direccion: string;
  telefono: string;
  correo: string;
  tipo_persona: string;
  nombre_completo: string;
}
