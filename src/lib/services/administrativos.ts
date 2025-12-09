import { http } from './http';

export type Administrativo = {
	id?: number;
	id_persona?: number;
	id_administrativo?: number;
	id_cargo?: number;
	nombre_cargo?: string;
	ci?: string;
	nombres: string;
	apellido_paterno?: string;
	apellido_materno?: string;
	nombre_completo?: string;
	direccion?: string;
	telefono?: string;
	correo?: string;
	estado_laboral: string;
	años_experiencia?: number;
	fecha_ingreso?: string;
	horario_entrada?: string;
	horario_salida?: string;
	area_trabajo?: string;
	observaciones?: string;
	horas_semana?: number;
};

export type Cargo = {
	id_cargo: number;
	nombre_cargo: string;
	descripcion?: string;
	estado?: string;
	fecha_creacion?: string;
};

export type AdministrativoCreate = {
	ci: string;
	nombres: string;
	apellido_paterno: string;
	apellido_materno?: string;
	direccion?: string;
	telefono?: string;
	correo?: string;
	id_cargo: number;
	estado_laboral?: string;
	años_experiencia?: number;
	fecha_ingreso?: string;
	horario_entrada?: string;
	horario_salida?: string;
	area_trabajo?: string;
	observaciones?: string;
};

export type AdministrativoUpdate = Partial<AdministrativoCreate>;

export const administrativosService = {
	getAdministrativos: async (completo: boolean = true): Promise<Administrativo[]> =>
		http.get(`/administrativos${http.buildQuery({ completo })}`),

	getAdministrativo: async (id_persona: number): Promise<Administrativo> =>
		http.get(`/administrativos/${id_persona}`),

	createAdministrativo: async (data: AdministrativoCreate): Promise<Administrativo> =>
		http.post('/administrativos', data),

	updateAdministrativo: async (id_persona: number, data: AdministrativoUpdate): Promise<Administrativo> =>
		http.put(`/administrativos/${id_persona}`, data),

	deleteAdministrativo: async (id_persona: number): Promise<Administrativo> =>
		http.del(`/administrativos/${id_persona}`),

	getCargos: async (): Promise<Cargo[]> =>
		http.get('/administrativos/cargos'),

	getCargo: async (id_cargo: number): Promise<Cargo> =>
		http.get(`/administrativos/cargos/${id_cargo}`)
};

