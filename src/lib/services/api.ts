// Entry point that compone servicios por dominio manteniendo la API existente.
import { statusService } from './status';
import { codigosService } from './codigos';
import { estudiantesService } from './estudiantes';
import { coursesService } from './courses';
import { personalService } from './personal';
import { academicService } from './academic';
import { esquelasService } from './esquelas';
import { http } from './http';

// Objeto unificado para compatibilidad con el código existente
export const apiClient = {
	...statusService,
	...codigosService,
	...estudiantesService,
	...coursesService,
	...personalService,
	...academicService,
	...esquelasService,

	// Passthroughs para compatibilidad con el código que usa apiClient.get(...)
	get: http.get,
	post: http.post,
	put: http.put,
	del: http.del,
	buildQuery: http.buildQuery
};

// Re-exportar servicios individuales si se prefiere importar por dominio
export {
	statusService,
	codigosService,
	estudiantesService,
	coursesService,
	personalService,
	academicService,
	esquelasService
};
