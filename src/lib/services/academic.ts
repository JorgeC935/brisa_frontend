import type {
	ProfesoresAsignadosResponseDTO,
	MateriasPorNivelResponseDTO,
	CargaAcademicaResponseDTO,
	CursosPorGestionResponseDTO
} from '$lib/types/api.js';
import { http } from './http';

export const academicService = {
	getReporteProfesoresAsignados: async (params?: {
		curso_id?: number;
		materia_id?: number;
		nivel?: 'inicial' | 'primaria' | 'secundaria';
		gestion?: string;
	}): Promise<ProfesoresAsignadosResponseDTO> => http.get(`/reports/academic/professors${http.buildQuery(params)}`),

	getReporteMateriasPorNivel: async (nivel?: 'inicial' | 'primaria' | 'secundaria'): Promise<MateriasPorNivelResponseDTO> => http.get(`/reports/academic/subjects${http.buildQuery({ nivel })}`),

	getReporteCargaAcademica: async (params?: {
		profesor_id?: number;
		gestion?: string;
	}): Promise<CargaAcademicaResponseDTO> => http.get(`/reports/academic/workload${http.buildQuery(params)}`),

	getReporteCursosPorGestion: async (params?: {
		gestion?: string;
		nivel?: 'inicial' | 'primaria' | 'secundaria';
	}): Promise<CursosPorGestionResponseDTO> => http.get(`/reports/academic/courses${http.buildQuery(params)}`)
};
