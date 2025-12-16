<script lang="ts">
    import { toast, type ToastMessage } from "$lib/stores/toast.svelte";
    import { fade, fly } from "svelte/transition";

    let toasts: ToastMessage[] = [];
    toast.subscribe((value) => (toasts = value));
</script>

<div class="toast-container">
    {#each toasts as t (t.id)}
        <div
            class="toast toast-{t.type}"
            role="alert"
            transition:fly={{ y: -20, duration: 300 }}
        >
            <div class="toast-content">
                {#if t.type === "success"}
                    <svg
                        class="toast-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                {:else if t.type === "error"}
                    <svg
                        class="toast-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                {:else}
                    <svg
                        class="toast-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                {/if}
                <span class="toast-message">{t.message}</span>
            </div>
            <button
                class="toast-close"
                on:click={() => toast.remove(t.id)}
                aria-label="Cerrar"
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    {/each}
</div>

<style>
    .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
    }

    .toast {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-width: 300px;
        max-width: 500px;
        border-left: 4px solid;
        pointer-events: auto;
    }

    .toast-success {
        border-left-color: #10b981;
    }

    .toast-error {
        border-left-color: #ef4444;
    }

    .toast-info {
        border-left-color: #3b82f6;
    }

    .toast-content {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
    }

    .toast-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
    }

    .toast-success .toast-icon {
        color: #10b981;
    }

    .toast-error .toast-icon {
        color: #ef4444;
    }

    .toast-info .toast-icon {
        color: #3b82f6;
    }

    .toast-message {
        color: #1e293b;
        font-size: 0.9rem;
        line-height: 1.4;
    }

    .toast-close {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
        transition: color 0.2s;
        flex-shrink: 0;
    }

    .toast-close:hover {
        color: #1e293b;
    }

    .toast-close svg {
        width: 16px;
        height: 16px;
    }
</style>
