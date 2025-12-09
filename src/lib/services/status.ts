import { http } from './http';

export const statusService = {
	healthCheck: async (): Promise<string> => http.get('/health'),
	getStatus: async (): Promise<any> => http.get('/status')
};
