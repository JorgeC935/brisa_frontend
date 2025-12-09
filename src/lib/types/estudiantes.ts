// Estudiantes y reportes relacionados
export interface Estudiante {
  id_estudiante: number;
  ci: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  direccion: string;
  telefono: string;
  correo: string;
  matricula: string;
  nombre_completo: string;
  fecha_nacimiento?: string | null;
  edad?: number | null;
  cursos?: string[];
}

export interface EstudianteListadoItem {
  id_estudiante: number;
  ci: string;
  nombre_completo: string;
  fecha_nacimiento?: string | null;
  edad?: number | null;
  cursos: string[];
}

export interface EstudianteListadoDTO {
  total: number;
  curso?: number | null;
  nivel?: string | null;
  gestion?: string | null;
  estudiantes: EstudianteListadoItem[];
}

export type TipoApoderado = 'padre' | 'madre';

export interface Apoderado {
  tipo: TipoApoderado;
  nombre_completo: string;
  telefono?: string;
}

export interface EstudianteApoderadoItem {
  id_estudiante: number;
  ci: string;
  nombre_completo: string;
  tiene_apoderados: boolean;
  apoderados: Apoderado[];
}

export interface EstudiantesApoderadosResponseDTO {
  total: number;
  estudiantes: EstudianteApoderadoItem[];
}

export interface ContactoApoderadoItem {
  id_estudiante: number;
  estudiante_ci: string;
  estudiante_nombre: string;
  tipo_apoderado: TipoApoderado;
  apoderado_nombre: string;
  telefono: string;
}

export interface ContactosApoderadosResponseDTO {
  total: number;
  contactos: ContactoApoderadoItem[];
}

export interface RangoEdadItem {
  rango_edad: string;
  cantidad: number;
  porcentaje: number;
}

export interface DistribucionEdadResponseDTO {
  total_estudiantes: number;
  distribucion: RangoEdadItem[];
}

export interface CursoHistorialItem {
  id_curso: number;
  nombre_curso: string;
  nivel: string;
  gestion: string;
}

export interface EstudianteHistorialItem {
  id_estudiante: number;
  ci: string;
  nombre_completo: string;
  total_cursos: number;
  cursos: CursoHistorialItem[];
}

export interface HistorialCursosResponseDTO {
  total_estudiantes: number;
  historiales: EstudianteHistorialItem[];
}
