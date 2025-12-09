import type { CodigoEsquela, CodigoEsquelaCreate, CodigoEsquelaUpdate, TipoCodigoEsquela } from '$lib/types/api.js';
import { http } from './http';

export const codigosService = {
	getCodigosEsquelas: async (tipo?: TipoCodigoEsquela): Promise<CodigoEsquela[]> => {
		const query = http.buildQuery({ tipo });
		return http.get<CodigoEsquela[]>(`/codigos-esquelas${query}`);
	},
	createCodigoEsquela: async (codigo: CodigoEsquelaCreate) => http.post<CodigoEsquela>('/codigos-esquelas', codigo),
	getCodigoEsquela: async (id: number) => http.get<CodigoEsquela>(`/codigos-esquelas/${id}`),
	updateCodigoEsquela: async (id: number, codigo: CodigoEsquelaUpdate) => http.put<CodigoEsquela>(`/codigos-esquelas/${id}`, codigo),
	deleteCodigoEsquela: async (id: number) => http.del<string>(`/codigos-esquelas/${id}`)
};
