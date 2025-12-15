import { http } from './http';
import { authService } from '../services/Usuarios_Roles/auth';

export const coursesService = {

	getCourses: async () => {

		// Obtener usuario desde el backend
		let me = await authService.getMe().catch(() => null);
		let id_persona = me?.id_persona;

		// Si por alguna razón no devuelve nada, intentar leer el token
		if (!id_persona) {
			const tokenData = authService.getToken();
			if (tokenData) {
				try {
					const parsed = JSON.parse(tokenData);
					id_persona = parsed?.id_persona;
				} catch { }
			}
		}
		return http.get<any>(`/courses/${http.buildQuery({ id_persona })}`);
	},
	getCourseTeachersList: async (id: number) => http.get<any>(`/courses/mis_cursos/${id}`),
	getCourse: async (id: number) => http.get<any>(`/courses/${id}`),
	getCourseStudents: async (courseId: number, params?: Record<string, any>) => http.get<any>(`/courses/${courseId}/students/${http.buildQuery(params)}`),
	getCourseTeachers: async (courseId: number, params?: Record<string, any>) => http.get<any>(`/courses/${courseId}/teachers/${http.buildQuery(params)}`),

	// CRUD operations
	createCourse: async (data: any) => http.post<any>('/courses/', data),
	updateCourse: async (id: number, data: any) => http.put<any>(`/courses/${id}`, data),
	deleteCourse: async (id: number) => http.del(`/courses/${id}`)
};
