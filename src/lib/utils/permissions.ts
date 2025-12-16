// src/lib/utils/permissions.ts
import { authStore } from '$lib/stores/Usuarios_Roles/auth.svelte';

/**
 * Verifica si el usuario puede gestionar profesores (crear, editar, eliminar)
 * Solo Director y Admin tienen estos permisos
 */
export function puedeGestionarProfesores(): boolean {
    const rol = authStore.user?.rol;
    console.log('🔍 Verificando permisos - Rol del usuario:', rol);
    console.log('🔍 Usuario completo:', authStore.user);
    const puede = rol === 'Director' || rol === 'Admin';
    console.log('🔍 ¿Puede gestionar profesores?', puede);
    return puede;
}

/**
 * Verifica si el usuario puede gestionar cursos (crear, editar, eliminar)
 * Solo Director y Admin tienen estos permisos
 */
export function puedeGestionarCursos(): boolean {
    const rol = authStore.user?.rol;
    return rol === 'Director' || rol === 'Admin';
}

/**
 * Verifica si el usuario puede gestionar materias (crear, editar, eliminar)
 * Solo Director y Admin tienen estos permisos
 */
export function puedeGestionarMaterias(): boolean {
    const rol = authStore.user?.rol;
    return rol === 'Director' || rol === 'Admin';
}

/**
 * Obtiene el mensaje de error apropiado cuando un usuario no tiene permisos
 */
export function getMensajePermisosDenegados(accion: string, modulo: string): string {
    const rol = authStore.user?.rol || 'Usuario';
    return `No tienes permisos para ${accion} ${modulo}. Solo Director y Admin pueden realizar esta acción. Tu rol actual: ${rol}`;
}

/**
 * Verifica permisos y retorna un objeto con el resultado y mensaje
 */
export function verificarPermiso(tipo: 'profesores' | 'cursos' | 'materias'): {
    permitido: boolean;
    mensaje: string;
    rol: string;
} {
    const rol = authStore.user?.rol || 'Usuario';
    let permitido = false;

    switch (tipo) {
        case 'profesores':
            permitido = puedeGestionarProfesores();
            break;
        case 'cursos':
            permitido = puedeGestionarCursos();
            break;
        case 'materias':
            permitido = puedeGestionarMaterias();
            break;
    }

    const mensaje = permitido
        ? ''
        : `Solo Director y Admin pueden gestionar ${tipo}. Tu rol actual: ${rol}`;

    return { permitido, mensaje, rol };
}

// Mensajes específicos por acción
export const MENSAJES_PERMISOS = {
    profesores: {
        crear: 'crear profesores',
        editar: 'editar profesores',
        eliminar: 'eliminar profesores',
        asignar: 'asignar materias a profesores'
    },
    cursos: {
        crear: 'crear cursos',
        editar: 'editar cursos',
        eliminar: 'eliminar cursos'
    },
    materias: {
        crear: 'crear materias',
        editar: 'editar materias',
        eliminar: 'eliminar materias'
    }
};
