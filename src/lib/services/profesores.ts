import { http } from './http';

export type Profesor = {
    id_profesor: number;
    id_persona: number;
    ci: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno?: string;
    direccion?: string;
    telefono?: string;
    correo?: string;
    id_cargo?: number;
    estado_laboral?: string;
    anos_experiencia?: number; // Backend uses 'anos', avoiding 'años' for consistency with DTO
    fecha_ingreso?: string;
    especialidad?: string;
    titulo_academico?: string;
    nivel_enseñanza?: string;
    observaciones?: string;
    asignaciones?: Asignacion[];
};

export type ProfesorCreate = {
    ci: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno?: string;
    direccion?: string;
    telefono?: string;
    correo?: string;
    id_cargo?: number;
    estado_laboral?: string;
    anos_experiencia?: number;
    fecha_ingreso?: string;
    especialidad?: string;
    titulo_academico?: string;
    nivel_enseñanza?: string;
    observaciones?: string;
};

export type ProfesorUpdate = Partial<ProfesorCreate>;

export type Asignacion = {
    id_profesor: number;
    id_curso: number;
    id_materia: number;
    nombre_profesor?: string;
    nombre_curso?: string;
    nombre_materia?: string;
};

export type AsignarCursoMateria = {
    id_profesor: number;
    id_curso: number;
    id_materia: number;
};

const assignmentCache = new Map<number, Asignacion[]>();
let professorsCache: Profesor[] | null = null;

export const profesoresService = {
    getProfesores: async (forceRefresh = false): Promise<Profesor[]> => {
        if (!forceRefresh && professorsCache) return professorsCache;
        const data = await http.get('/profesores') as Profesor[];
        professorsCache = data;
        return data;
    },

    getProfesor: async (id: number): Promise<Profesor> => http.get(`/profesores/${id}`),

    createProfesor: async (data: ProfesorCreate): Promise<Profesor> => {
        const res = await http.post('/profesores', data) as Profesor;
        professorsCache = null;
        return res;
    },

    updateProfesor: async (id: number, data: ProfesorUpdate): Promise<Profesor> => {
        const res = await http.put(`/profesores/${id}`, data) as Profesor;
        professorsCache = null;
        return res;
    },

    deleteProfesor: async (id: number): Promise<void> => {
        await http.del(`/profesores/${id}`);
        professorsCache = null;
        assignmentCache.delete(id);
    },

    // Asignaciones
    getAsignaciones: async (id_profesor: number): Promise<Asignacion[]> => {
        if (assignmentCache.has(id_profesor)) {
            return assignmentCache.get(id_profesor)!;
        }
        const data = await http.get(`/profesores/${id_profesor}/asignaciones`) as Asignacion[];
        assignmentCache.set(id_profesor, data);
        return data;
    },

    clearAssignmentCache: () => {
        assignmentCache.clear();
    },

    asignarCursoMateria: async (data: AsignarCursoMateria): Promise<Asignacion> => {
        const res = await http.post('/profesores/asignar-curso-materia', data) as Asignacion;
        assignmentCache.delete(data.id_profesor);
        return res;
    },

    eliminarAsignacion: async (
        id_profesor: number,
        id_curso: number,
        id_materia: number
    ): Promise<void> => {
        await http.del(`/profesores/${id_profesor}/asignaciones/${id_curso}/${id_materia}`);
        assignmentCache.delete(id_profesor);
    }
};
