<script lang="ts">
    import { createEventDispatcher } from "svelte";

    import { coursesService } from "$lib/services/courses";
    import { getIconSvg } from "$lib/components/svg";

    export let curso: any;

    const dispatch = createEventDispatcher();
    let loading = false;
    let error = "";

    let formData = {
        nombre_curso: curso.nombre_curso,
        nivel: (curso.nivel || "secundaria").toLowerCase(),
        gestion: curso.gestion,
    };

    const niveles = [
        { value: "inicial", label: "Inicial" },
        { value: "primaria", label: "Primaria" },
        { value: "secundaria", label: "Secundaria" },
    ];

    async function handleSubmit() {
        if (!formData.nombre_curso?.trim()) {
            error = "El nombre es obligatorio";
            return;
        }

        try {
            loading = true;
            error = "";
            const payload = {
                ...formData,
                gestion: formData.gestion.toString(),
            };
            await coursesService.updateCourse(curso.id_curso, payload);
            dispatch("save");
        } catch (err: any) {
            error =
                err.response?.data?.detail || "Error al actualizar el curso";
        } finally {
            loading = false;
        }
    }
</script>

<form on:submit|preventDefault={handleSubmit} class="form-content">
    {#if error}
        <div class="alert alert-error">
            {@html getIconSvg("alert-triangle")}
            {error}
        </div>
    {/if}

    <div class="form-group">
        <label for="nombre">Nombre del Curso</label>
        <input
            type="text"
            id="nombre"
            bind:value={formData.nombre_curso}
            placeholder="Ej. 1ro de Secundaria A"
        />
    </div>

    <div class="form-row">
        <div class="form-group">
            <label for="nivel">Nivel</label>
            <div class="select-wrapper">
                <select id="nivel" bind:value={formData.nivel}>
                    {#each niveles as n}
                        <option value={n.value}>{n.label}</option>
                    {/each}
                </select>
                <div class="select-icon">
                    {@html getIconSvg("chevron-down")}
                </div>
            </div>
        </div>

        <div class="form-group">
            <label for="gestion">Gestión (Año)</label>
            <input
                type="number"
                id="gestion"
                bind:value={formData.gestion}
                min="2000"
                max="2100"
            />
        </div>
    </div>

    <div class="form-actions">
        <button
            type="button"
            class="btn-secondary"
            on:click={() => dispatch("cancel")}
        >
            Cancelar
        </button>
        <button type="submit" class="btn-primary" disabled={loading}>
            {#if loading}
                <span class="spinner"></span>
                <span>Guardando...</span>
            {:else}
                {@html getIconSvg("save")}
                Guardar Cambios
            {/if}
        </button>
    </div>
</form>

<style>
    :root {
        --cyan: #00cfe6;
        --cyan-dark: #00b3c7;
        --text: #1e293b;
        --text-secondary: #64748b;
        --border-color: #e2e8f0;
        --bg-light: #f1f5f9;
        --danger: #ef4444;
    }
    .form-content {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .form-group label {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text);
    }
    .form-group input,
    .form-group select {
        padding: 12px 16px;
        border: 1px solid var(--border-color);
        border-radius: 10px;
        font-size: 0.95rem;
        color: var(--text);
        outline: none;
        transition: border-color 0.2s;
        width: 100%;
        background: white;
    }
    .form-group input:focus,
    .form-group select:focus {
        border-color: var(--cyan);
        box-shadow: 0 0 0 3px rgba(0, 207, 230, 0.1);
    }
    .select-wrapper {
        position: relative;
    }
    .select-wrapper select {
        appearance: none;
        padding-right: 40px;
    }
    .select-icon {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: var(--text-secondary);
        display: flex;
    }
    .select-icon :global(svg) {
        width: 16px;
        height: 16px;
    }
    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid var(--border-color);
    }
    .btn-primary {
        background: var(--cyan);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.95rem;
    }
    .btn-primary:hover {
        background: var(--cyan-dark);
        transform: translateY(-2px);
    }
    .btn-primary:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
    .btn-secondary {
        background: white;
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
        padding: 10px 20px;
        border-radius: 10px;
        font-weight: 500;
        cursor: pointer;
    }
    .btn-secondary:hover {
        background: var(--bg-light);
        color: var(--text);
    }
    .alert {
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
    }
    .alert-error {
        background: #fef2f2;
        color: #ef4444;
        border: 1px solid #fee2e2;
    }
    .alert :global(svg) {
        width: 18px;
        height: 18px;
    }
    .spinner {
        width: 18px;
        height: 18px;
        box-sizing: border-box;
        border: 2px solid #ffffff;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        display: block;
    }
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
