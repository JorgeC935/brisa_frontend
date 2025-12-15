import { http } from './http';

export type Materia = {
    id_materia: number;
    nombre_materia: string;
    nivel: string;
    alias?: string;
};

export type MateriaCreate = {
    nombre_materia: string;
    nivel: string;
    alias?: string;
};

export type MateriaUpdate = Partial<MateriaCreate>;

export const materiasService = {
    getMaterias: async () => http.get<Materia[]>('/materias/'),
    getMateria: async (id: number) => http.get<Materia>(`/materias/${id}`),
    createMateria: async (data: MateriaCreate) => http.post<Materia>('/materias/', data),
    updateMateria: async (id: number, data: MateriaUpdate) => http.put<Materia>(`/materias/${id}`, data),
    deleteMateria: async (id: number) => http.del(`/materias/${id}`)
};
