import type {
	Estudiante,
	EstudianteListadoDTO,
	EstudiantesApoderadosResponseDTO,
	ContactosApoderadosResponseDTO,
	DistribucionEdadResponseDTO,
	HistorialCursosResponseDTO
} from '$lib/types/api.js';
import { http } from './http';

export const estudiantesService = {
	getEstudiantes: async (): Promise<Estudiante[]> => http.get('/estudiantes/'),
	getEstudiante: async (id: number): Promise<Estudiante> => http.get(`/estudiantes/${id}`),
	getReporteEstudiantes: async (params?: {
		curso_id?: number;
		nivel?: 'inicial' | 'primaria' | 'secundaria';
		gestion?: string;
	}): Promise<EstudianteListadoDTO> => http.get(`/reports/students${http.buildQuery(params)}`),
	getReporteEstudiantesApoderados: async (con_apoderados?: boolean): Promise<EstudiantesApoderadosResponseDTO> => http.get(`/reports/students/guardians${http.buildQuery({ con_apoderados })}`),
	getReporteContactosApoderados: async (params?: {
		curso_id?: number;
		nivel?: 'inicial' | 'primaria' | 'secundaria';
		gestion?: string;
	}): Promise<ContactosApoderadosResponseDTO> => http.get(`/reports/students/guardian-contacts${http.buildQuery(params)}`),
	getReporteDistribucionEdad: async (params?: {
		curso_id?: number;
		nivel?: 'inicial' | 'primaria' | 'secundaria';
		gestion?: string;
	}): Promise<DistribucionEdadResponseDTO> => http.get(`/reports/students/age-distribution${http.buildQuery(params)}`),
	getReporteHistorialCursos: async (estudiante_id?: number): Promise<HistorialCursosResponseDTO> => http.get(`/reports/students/course-history${http.buildQuery({ estudiante_id })}`)
};
