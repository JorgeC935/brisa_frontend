// Punto de entrada que reexporta tipos organizados por dominio
export * from './common.js';
export * from './auth.js';
export * from './personal.js';
export * from './estudiantes.js';
export * from './academic.js';
export * from './esquelas.js';
export type {
	CodigoEsquela,
	CodigoEsquelaCreate,
	CodigoEsquelaUpdate,
	TipoCodigoEsquela,
	EsquelaCreate,
	EsquelaResponse,
	EsquelasPorProfesorResponseDTO,
	EsquelasPorFechaResponseDTO,
	CodigosFrecuentesResponseDTO
} from './esquelas.js';
