<script lang="ts">
    import { onMount } from "svelte";

    import { coursesService } from "$lib/services/courses";
    import { fade, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { getIconSvg } from "$lib/components/svg";
    import CreateCurso from "./CreateCurso.svelte";
    import EditarCurso from "./EditarCurso.svelte";
    import Toast from "$lib/components/Toast.svelte";

    let cursos: any[] = [];
    let searchQuery = "";
    let selectedNivel = "";
    let niveles: string[] = [];
    let mostrarNuevo = false;
    let mostrarEditar = false;
    let mostrarEliminar = false;
    let cursoSeleccionado: any | null = null;
    let cursoAEliminar: any | null = null;
    let isLoading = true;
    let isDeleting = false;

    // Toast State
    let toastMessage = "";
    let toastType: "success" | "error" | "info" = "info";

    async function cargarCursos() {
        try {
            isLoading = true;
            const res = await coursesService.getCourses();
            cursos = Array.isArray(res) ? res : res.data || [];
        } catch (error) {
            console.error("Error cargando cursos:", error);
        } finally {
            isLoading = false;
        }
    }

    onMount(() => {
        cargarCursos();
    });

    const normalizeNivel = (n: string) => {
        if (!n) return "";
        return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
    };

    $: niveles = [
        ...new Set(cursos.map((c) => normalizeNivel(c.nivel)).filter(Boolean)),
    ].sort();

    $: filtrados = cursos.filter((c) => {
        const matchesSearch =
            c.nombre_curso.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.gestion?.toString().includes(searchQuery);
        const matchesNivel = selectedNivel
            ? normalizeNivel(c.nivel) === selectedNivel
            : true;
        return matchesSearch && matchesNivel;
    });

    function abrirNuevo() {
        mostrarNuevo = true;
        mostrarEditar = false;
    }

    function abrirEditar(c: any) {
        cursoSeleccionado = c;
        mostrarEditar = true;
        mostrarNuevo = false;
    }

    function cerrarForms() {
        mostrarNuevo = false;
        mostrarEditar = false;
        mostrarEliminar = false;
        cursoSeleccionado = null;
        cursoAEliminar = null;
    }

    async function onSave() {
        cerrarForms();
        await cargarCursos();
        toastMessage = "Curso guardado correctamente";
        toastType = "success";
    }

    async function onDelete() {
        cerrarForms();
        await cargarCursos();
        toastMessage = "Curso eliminado correctamente";
        toastType = "success";
    }

    function confirmDelete(c: any) {
        cursoAEliminar = c;
        mostrarEliminar = true;
    }

    async function ejecutarEliminar() {
        if (cursoAEliminar) {
            isDeleting = true;
            try {
                await coursesService.deleteCourse(cursoAEliminar.id_curso);
                await cargarCursos();
                cerrarForms();
                toastMessage = "Curso eliminado correctamente";
                toastType = "success";
            } catch (error) {
                console.error("Error eliminando curso:", error);
                toastMessage = "Error al eliminar el curso";
                toastType = "error";
            } finally {
                isDeleting = false;
            }
        }
    }

    function getBadgeClass(nivel: string) {
        if (!nivel) return "badge-gray";
        const n = nivel.toLowerCase().trim();
        if (n.includes("inicial")) return "badge-green";
        if (n.includes("primaria")) return "badge-yellow";
        if (n.includes("secundaria")) return "badge-blue";
        return "badge-purple";
    }
</script>

{#if isLoading}
    <div class="panel">
        <div class="loading-state">Cargando cursos...</div>
    </div>
{:else}
    <div class="panel">
        <div class="title-section">
            <div class="title-with-icon">
                <div class="title-icon">
                    {@html getIconSvg("book-open")}
                </div>
                <div>
                    <h1>Cursos</h1>
                    <p>Gestiona los cursos y niveles académicos</p>
                </div>
            </div>
        </div>

        <!-- BUTTONS ROW -->
        <div class="button-row">
            <button class="btn-primary" on:click={abrirNuevo}>
                {@html getIconSvg("plus")}
                Nuevo Curso
            </button>
        </div>

        <!-- FILTERS ROW -->
        <div class="filters">
            <input
                type="text"
                placeholder="Buscar curso o gestión..."
                bind:value={searchQuery}
            />

            <div class="filter-group">
                <div class="select-wrapper">
                    <select bind:value={selectedNivel}>
                        <option value="">Todos los niveles</option>
                        {#each niveles as nivel}
                            <option value={nivel}>{nivel}</option>
                        {/each}
                    </select>
                    <div class="select-icon">
                        {@html getIconSvg("chevron-down")}
                    </div>
                </div>
            </div>
        </div>

        {#if filtrados.length === 0}
            <div class="empty-state">
                <p>No se encontraron cursos.</p>
            </div>
        {:else}
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Nivel</th>
                            <th>Gestión</th>
                            <th class="actions-col">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each filtrados as c (c.id_curso)}
                            {@const nivelTexto = normalizeNivel(c.nivel)}
                            {@const badgeClass = getBadgeClass(c.nivel)}
                            <tr>
                                <td
                                    class="font-medium"
                                    on:click={() => abrirEditar(c)}
                                >
                                    {c.nombre_curso}
                                </td>
                                <td
                                    on:click={() => abrirEditar(c)}
                                    style="min-width: 100px;"
                                >
                                    {nivelTexto}
                                    <span
                                        class="badge {badgeClass}"
                                        style="margin-left: 8px;"
                                    >
                                        {nivelTexto}
                                    </span>
                                </td>
                                <td on:click={() => abrirEditar(c)}
                                    >{c.gestion}</td
                                >
                                <td class="actions-col">
                                    <button
                                        class="icon-btn edit-btn"
                                        title="Editar"
                                        on:click|stopPropagation={() =>
                                            abrirEditar(c)}
                                    >
                                        {@html getIconSvg("edit")}
                                    </button>
                                    <button
                                        class="icon-btn delete-btn"
                                        title="Eliminar"
                                        on:click|stopPropagation={() =>
                                            confirmDelete(c)}
                                    >
                                        {@html getIconSvg("trash")}
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
{/if}

{#if mostrarNuevo}
    <div
        class="modal-backdrop"
        on:click|self={cerrarForms}
        transition:fade={{ duration: 200 }}
        role="button"
        tabindex="0"
        on:keydown={(e) => e.key === "Escape" && cerrarForms()}
    >
        <div
            class="modal-content"
            transition:scale={{ duration: 300, easing: quintOut, start: 0.95 }}
        >
            <div class="modal-header">
                <h2>Nuevo Curso</h2>
                <button class="close-btn" on:click={cerrarForms}>
                    {@html getIconSvg("x")}
                </button>
            </div>
            <div class="modal-body">
                <CreateCurso on:save={onSave} on:cancel={cerrarForms} />
            </div>
        </div>
    </div>
{/if}

{#if mostrarEditar && cursoSeleccionado}
    <div
        class="modal-backdrop"
        on:click|self={cerrarForms}
        transition:fade={{ duration: 200 }}
        role="button"
        tabindex="0"
        on:keydown={(e) => e.key === "Escape" && cerrarForms()}
    >
        <div
            class="modal-content"
            transition:scale={{ duration: 300, easing: quintOut, start: 0.95 }}
        >
            <div class="modal-header">
                <h2>Editar Curso</h2>
                <button class="close-btn" on:click={cerrarForms}>
                    {@html getIconSvg("x")}
                </button>
            </div>
            <div class="modal-body">
                <EditarCurso
                    curso={cursoSeleccionado}
                    on:save={onSave}
                    on:cancel={cerrarForms}
                    on:delete={onDelete}
                />
            </div>
        </div>
    </div>
{/if}

{#if mostrarEliminar}
    <div
        class="modal-backdrop"
        on:click|self={cerrarForms}
        transition:fade={{ duration: 200 }}
        role="button"
        tabindex="0"
        on:keydown={(e) => e.key === "Escape" && cerrarForms()}
    >
        <div
            class="modal-content"
            transition:scale={{ duration: 300, easing: quintOut, start: 0.95 }}
        >
            <div class="modal-header">
                <h2>Confirmar Eliminación</h2>
                <button class="close-btn" on:click={cerrarForms}>
                    {@html getIconSvg("x")}
                </button>
            </div>
            <div class="modal-body">
                <div class="confirm-content">
                    <div class="warning-icon">
                        {@html getIconSvg("alert-triangle")}
                    </div>
                    <p>
                        ¿Estás seguro de que deseas eliminar el curso <strong
                            >{cursoAEliminar?.nombre_curso}</strong
                        >?
                    </p>
                    <p class="warning-text">
                        Esta acción no se puede deshacer.
                    </p>
                    <div class="form-actions split">
                        <button
                            class="btn-secondary"
                            on:click={cerrarForms}
                            disabled={isDeleting}>Cancelar</button
                        >
                        <button
                            class="btn-danger"
                            on:click={ejecutarEliminar}
                            disabled={isDeleting}
                        >
                            {#if isDeleting}
                                <span class="spinner-sm"></span> Eliminando...
                            {:else}
                                {@html getIconSvg("trash-2")}
                                Eliminar Curso
                            {/if}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

<Toast message={toastMessage} type={toastType} />

<style>
    :root {
        --cyan: #00cfe6;
        --cyan-dark: #00b3c7;
        --text: #1e293b;
        --text-secondary: #64748b;
        --muted: #94a3b8;
        --bg-light: #f1f5f9;
        --bg-white: #ffffff;
        --border-color: #e2e8f0;
        --danger: #ef4444;
        --danger-light: #fef2f2;
        --warning: #f59e0b;
    }

    .panel {
        background: var(--bg-white);
        border-radius: 14px;
        padding: 24px;
        box-shadow: 0 6px 18px rgba(25, 40, 60, 0.02);
        border: 1px solid #eef6fa;
        margin-bottom: 2rem;
    }

    .title-section {
        margin-bottom: 24px;
    }
    .title-with-icon {
        display: flex;
        align-items: center;
        gap: 16px;
    }
    .title-icon {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #00cfe6 0%, #0db9d5 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(0, 207, 230, 0.3);
    }
    .title-icon :global(svg) {
        width: 24px;
        height: 24px;
    }
    .title-section h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text);
        margin: 0 0 4px;
    }
    .title-section p {
        color: var(--text-secondary);
        color: #64748b;
        font-style: italic;
    }

    /* ==================== ACTION ICONS COLORS ==================== */
    .icon-btn.edit-btn {
        color: #00cfe6;
    }
    .icon-btn.edit-btn:hover {
        background: #e0f7fa;
        color: #00a6b8;
    }
    .icon-btn.delete-btn {
        color: #ef4444;
    }
    .icon-btn.delete-btn:hover {
        background: #fee2e2;
        color: #dc2626;
    }

    .btn-primary {
        background: var(--cyan);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 10px rgba(0, 207, 230, 0.2);
    }
    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(0, 207, 230, 0.3);
        background: var(--cyan-dark);
    }
    .btn-secondary {
        background: white;
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
        padding: 10px 20px;
        border-radius: 10px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }
    .btn-secondary:hover {
        background: var(--bg-light);
        color: var(--text);
    }
    .icon-btn {
        background: none;
        border: none;
        padding: 6px;
        border-radius: 8px;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin: 0 2px;
    }
    .icon-btn:hover {
        background: var(--bg-light);
        color: var(--cyan);
    }
    .icon-btn.delete-btn {
        color: var(--danger);
    }
    .icon-btn.delete-btn:hover {
        background: var(--danger-light);
        color: var(--danger);
    }
    .icon-btn :global(svg) {
        width: 18px;
        height: 18px;
    }

    /* ==================== DATA TABLE ==================== */
    .table-container {
        overflow-x: auto;
        border-radius: 10px;
        border: 1px solid var(--border-color);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        min-height: 100px;
    }
    .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.95rem;
        table-layout: fixed;
    }
    .data-table th {
        text-align: left;
        padding: 16px 24px;
        background: #f8fafc;
        color: var(--text-secondary);
        font-weight: 600;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid var(--border-color);
    }
    .data-table td {
        padding: 16px 24px;
        border-bottom: 1px solid var(--border-color);
        color: var(--text);
        vertical-align: middle;
    }
    .data-table tbody tr:hover {
        background: #f8fafc;
        cursor: pointer;
    }
    .font-medium {
        font-weight: 600;
        color: var(--text);
    }

    /* Column Width Distribution */
    /* Column Width Distribution */
    .data-table th:nth-child(1),
    .data-table td:nth-child(1) {
        width: 40%;
    }

    .data-table th:nth-child(2),
    .data-table td:nth-child(2) {
        width: 30%;
    }

    .data-table th:nth-child(3),
    .data-table td:nth-child(3) {
        width: 15%;
    }

    .data-table th.actions-col,
    .data-table td.actions-col {
        width: 15%;
        text-align: right;
        white-space: nowrap;
    }

    /* ==================== BADGES ==================== */
    .badge {
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.025em;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-light);
        color: var(--text-secondary);
        min-width: 90px;
        text-transform: capitalize;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    .badge-blue {
        background: #e0f2fe !important;
        color: #0369a1 !important;
        border: 1px solid #bae6fd;
    }
    .badge-green {
        background: #dcfce7 !important;
        color: #15803d !important;
        border: 1px solid #bbf7d0;
    }
    .badge-yellow {
        background: #fef9c3 !important;
        color: #a16207 !important;
        border: 1px solid #fde047;
    }
    .badge-gray {
        background: #f1f5f9 !important;
        color: #475569 !important;
        border: 1px solid #e2e8f0;
    }
    .badge-purple {
        background: #f3e8ff !important;
        color: #7e22ce !important;
        border: 1px solid #e9d5ff;
    }

    .loading-state,
    .empty-state {
        padding: 60px 20px;
        text-align: center;
        color: var(--text-secondary);
    }

    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
    }
    .modal-content {
        background: white;
        border-radius: 16px;
        width: 100%;
        max-width: 600px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        max-height: 90vh;
    }
    .modal-header {
        padding: 20px 24px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1e293b;
    }
    .close-btn {
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .close-btn:hover {
        background: #f1f5f9;
        color: #ef4444;
    }
    .close-btn :global(svg) {
        width: 20px;
        height: 20px;
    }
    .modal-body {
        padding: 24px;
        overflow-y: auto;
    }

    .button-row {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-bottom: 20px;
    }

    .filters {
        display: flex;
        gap: 16px;
        margin-bottom: 28px;
        align-items: center;
        flex-wrap: nowrap;
    }

    .filters input[type="text"] {
        flex: 1;
        max-width: 400px;
        padding: 12px 18px;
        border: 1px solid var(--border-color);
        border-radius: 12px;
        background: white;
        font-size: 0.95rem;
        outline: none;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
        transition: all 0.2s;
    }

    .filters input[type="text"]:focus {
        border-color: var(--cyan);
        box-shadow: 0 0 0 3px rgba(0, 207, 230, 0.1);
    }

    .filter-group {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-direction: row;
        flex-wrap: nowrap;
        flex-shrink: 0;
    }

    .filter-group select {
        padding: 12px 18px;
        padding-right: 40px;
        border: 1px solid var(--border-color);
        border-radius: 12px;
        background: white;
        font-size: 0.95rem;
        cursor: pointer;
        color: var(--text);
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
        outline: none;
        transition: all 0.2s;
        appearance: none;
    }

    .filter-group select:focus {
        border-color: var(--cyan);
        box-shadow: 0 0 0 3px rgba(0, 207, 230, 0.1);
    }

    .select-wrapper {
        position: relative;
        display: flex;
        align-items: center;
    }

    .select-icon {
        position: absolute;
        right: 14px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .select-icon :global(svg) {
        width: 16px;
        height: 16px;
    }

    .confirm-content {
        text-align: center;
        padding: 1rem;
    }
    .warning-icon {
        color: var(--warning);
        margin-bottom: 1rem;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .warning-icon :global(svg) {
        width: 48px;
        height: 48px;
    }
    .warning-text {
        color: var(--text-secondary);
        font-size: 0.9rem;
        margin-bottom: 2rem;
    }
    .form-actions.split {
        display: flex;
        justify-content: center;
        gap: 16px;
        margin-top: 24px;
    }
    .btn-danger {
        background: var(--danger);
        color: white;
        border: none;
        padding: 10px 24px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 10px rgba(239, 68, 68, 0.2);
        transition: all 0.2s;
    }
    .btn-danger:hover {
        background: #dc2626;
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(239, 68, 68, 0.3);
    }
    .btn-danger:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
    }

    .spinner-sm {
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-top: 2px solid transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        display: inline-block;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
