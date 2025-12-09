import type {
	EsquelaResponse,
	EsquelaCreate,
	EsquelasPorProfesorResponseDTO,
	EsquelasPorFechaResponseDTO,
	CodigosFrecuentesResponseDTO
} from '$lib/types/api.js';
import { http } from './http';

export const esquelasService = {
	// CRUD Esquelas
	getEsquelas: async (params?: Record<string, any>): Promise<any> => http.get(`/esquelas/${http.buildQuery(params)}`),
	createEsquela: async (esquela: EsquelaCreate): Promise<EsquelaResponse> => http.post('/esquelas/', esquela),
	getEsquela: async (id: number): Promise<EsquelaResponse> => http.get(`/esquelas/${id}`),
	deleteEsquela: async (id: number): Promise<string> => http.del(`/esquelas/${id}`),

	// Aggregations & reports core
	getEsquelasAggregateByCourse: async (year?: number): Promise<any> => http.get(`/esquelas/aggregate/by-course${http.buildQuery({ year })}`),
	getEsquelasAggregateByPeriod: async (group_by: string = 'year'): Promise<any> => http.get(`/esquelas/aggregate/by-period${http.buildQuery({ group_by })}`),
	getStudentEsquelas: async (studentId: number, params?: Record<string, any>): Promise<any> => http.get(`/students/${studentId}/esquelas${http.buildQuery(params)}`),
	getReportsRanking: async (params: Record<string, any>): Promise<any> => http.get(`/reports/ranking${http.buildQuery(params)}`),

	// Reportes de Esquelas
	getReporteEsquelasPorProfesor: async (params?: {
		profesor_id?: number;
		from?: string;
		to?: string;
	}): Promise<EsquelasPorProfesorResponseDTO> => http.get(`/reports/esquelas/by-professor${http.buildQuery(params)}`),

	getReporteEsquelasPorFecha: async (params?: {
		from?: string;
		to?: string;
		tipo?: 'reconocimiento' | 'orientacion';
	}): Promise<EsquelasPorFechaResponseDTO> => http.get(`/reports/esquelas/by-date${http.buildQuery(params)}`),

	getReporteCodigosFrecuentes: async (params?: {
		tipo?: 'reconocimiento' | 'orientacion';
		limit?: number;
		from?: string;
		to?: string;
	}): Promise<CodigosFrecuentesResponseDTO> => http.get(`/reports/esquelas/frequent-codes${http.buildQuery(params)}`)
};
