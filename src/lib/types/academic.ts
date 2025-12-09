// Reportes académicos
export interface ProfesorAsignadoItem {
  id_profesor: number;
  ci: string;
  nombre_completo: string;
  telefono?: string;
  correo?: string;
  curso: string;
  materia: string;
}

export interface ProfesoresAsignadosResponseDTO {
  total: number;
  curso?: string;
  materia?: string;
  nivel?: string;
  gestion?: string;
  profesores: ProfesorAsignadoItem[];
}

export interface MateriaNivelItem {
  id_materia: number;
  nombre_materia: string;
  nivel: string;
}

export interface MateriasPorNivelResponseDTO {
  total: number;
  nivel?: string;
  materias: MateriaNivelItem[];
}

export interface AsignacionCargaItem {
  curso: string;
  materia: string;
  nivel: string;
  gestion: string;
}

export interface ProfesorCargaItem {
  id_profesor: number;
  ci: string;
  nombre_completo: string;
  telefono?: string;
  correo?: string;
  total_asignaciones: number;
  cursos_distintos: number;
  materias_distintas: number;
  asignaciones: AsignacionCargaItem[];
}

export interface CargaAcademicaResponseDTO {
  total_profesores: number;
  profesores: ProfesorCargaItem[];
}

export interface CursoGestionItem {
  id_curso: number;
  nombre_curso: string;
  nivel: string;
  gestion: string;
  total_estudiantes: number;
}

export interface CursosPorGestionResponseDTO {
  total: number;
  gestion?: string;
  nivel?: string;
  cursos: CursoGestionItem[];
}
