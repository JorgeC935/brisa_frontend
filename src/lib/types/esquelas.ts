import type { Estudiante } from './estudiantes';
import type { Profesor, Registrador } from './personal';

export type TipoCodigoEsquela = 'reconocimiento' | 'orientacion';

export interface CodigoEsquela {
  id_codigo: number;
  codigo: string;
  descripcion: string;
  tipo: TipoCodigoEsquela;
}

export interface CodigoEsquelaCreate {
  tipo: TipoCodigoEsquela;
  codigo: string;
  descripcion: string;
}

export type CodigoEsquelaUpdate = CodigoEsquelaCreate;

export interface EsquelaCreate {
  id_estudiante: number;
  fecha: string;
  observaciones: string;
  codigos: number[];
  id_profesor?: number;
}

export interface EsquelaResponse {
  id_esquela: number;
  fecha: string;
  observaciones: string;
  estudiante?: Estudiante;
  profesor?: Profesor;
  registrador?: Registrador;
  codigos: CodigoEsquela[];
}

export interface EsquelasPorProfesorItem {
  id_profesor: number;
  profesor_nombre: string;
  profesor_ci: string;
  total_esquelas: number;
  reconocimientos: number;
  orientaciones: number;
  esquelas: Array<{
    id_esquela: number;
    fecha: string;
    estudiante_nombre: string;
    estudiante_ci: string;
    codigos: string[];
    observaciones?: string | null;
  }>;
}

export interface EsquelasPorProfesorResponseDTO {
  total_profesores: number;
  total_esquelas: number;
  profesores: EsquelasPorProfesorItem[];
}

export interface EsquelasPorFechaItem {
  id_esquela: number;
  fecha: string;
  estudiante_nombre: string;
  estudiante_ci: string;
  profesor_nombre: string;
  registrador_nombre: string;
  codigos: string[];
  observaciones?: string | null;
}

export interface EsquelasPorFechaResponseDTO {
  total: number;
  reconocimientos: number;
  orientaciones: number;
  fecha_desde?: string | null;
  fecha_hasta?: string | null;
  esquelas: EsquelasPorFechaItem[];
}

export interface CodigoFrecuenteItem {
  codigo: string;
  descripcion: string;
  tipo: TipoCodigoEsquela;
  total_aplicaciones: number;
  porcentaje: number;
}

export interface CodigosFrecuentesResponseDTO {
  total_codigos: number;
  total_aplicaciones: number;
  codigos: CodigoFrecuenteItem[];
}
