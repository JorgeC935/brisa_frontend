// src/lib/stores/toast.svelte.ts
import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
    id: number;
    message: string;
    type: ToastType;
    duration: number;
}

function createToastStore() {
    const { subscribe, update } = writable<ToastMessage[]>([]);
    let nextId = 1;

    function show(message: string, type: ToastType = 'info', duration: number = 5000) {
        const id = nextId++;
        const newToast: ToastMessage = { id, message, type, duration };

        update((toasts: ToastMessage[]) => [...toasts, newToast]);

        setTimeout(() => {
            remove(id);
        }, duration);
    }

    function remove(id: number) {
        update((toasts: ToastMessage[]) => toasts.filter((t: ToastMessage) => t.id !== id));
    }

    return {
        subscribe,
        success: (message: string, duration?: number) => show(message, 'success', duration),
        error: (message: string, duration?: number) => show(message, 'error', duration),
        info: (message: string, duration?: number) => show(message, 'info', duration),
        remove
    };
}

export const toast = createToastStore();
