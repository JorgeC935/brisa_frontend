import { http } from './http';
import { authService } from './auth';

export const coursesService = {
	getCourses: async () => {
		let id_persona = authService.getUserData()?.id_persona;
		// Refresca datos de usuario si no están en localStorage
		if (!id_persona) {
			const user = await authService.getCurrentUser();
			id_persona = user?.id_persona;
		}
		return http.get<any>(`/courses${http.buildQuery({ id_persona })}`);
	},
	getCourseTeachersList: async (id: number) => http.get<any>(`/courses/mis_cursos/${id}`),
	getCourse: async (id: number) => http.get<any>(`/courses/${id}`),
	getCourseStudents: async (courseId: number, params?: Record<string, any>) => http.get<any>(`/courses/${courseId}/students${http.buildQuery(params)}`),
	getCourseTeachers: async (courseId: number, params?: Record<string, any>) => http.get<any>(`/courses/${courseId}/teachers${http.buildQuery(params)}`)
};
