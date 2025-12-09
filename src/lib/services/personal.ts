import type { Profesor, Registrador } from '$lib/types/api.js';
import { http } from './http';

export const personalService = {
	getProfesores: async (): Promise<Profesor[]> => http.get('/profesores/'),
	getProfesor: async (id: number): Promise<Profesor> => http.get(`/profesores/${id}`),
	getRegistradores: async (): Promise<Registrador[]> => http.get('/registradores/'),
	getRegistrador: async (id: number): Promise<Registrador> => http.get(`/registradores/${id}`)
};
