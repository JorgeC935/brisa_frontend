<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import Toast from "$lib/components/Toast.svelte";
    import {
        profesoresService,
        type Profesor,
        type Asignacion,
    } from "$lib/services/profesores.js";
    import { administrativosService } from "$lib/services/administrativos.js";
    import { getIconSvg } from "$lib/components/svg.js";
    import AsignarCursos from "./AsignarCursos.svelte";
    import { fade, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";

    export let profesor: Profesor;

    const dispatch = createEventDispatcher<{
        save: Profesor;
        cancel: void;
        delete: { id: number };
    }>();

    let profesorData: any = {
        ci: "",
        nombres: "",
        apellido_paterno: "",
        apellido_materno: "",
        direccion: "",
        telefono: "",
        correo: "",
        id_cargo: null,
        estado_laboral: "activo",
        anos_experiencia: 0,
        fecha_ingreso: "",
        especialidad: "",
        titulo_academico: "",
        nivel_enseñanza: "todos",
        observaciones: "",
    };

    let asignaciones: Asignacion[] = [];
    let asignacionesPendientes: any[] = []; // New additions
    let asignacionesEliminar: Asignacion[] = []; // To be deleted

    let cargandoAsignaciones = false;

    let cargos: any[] = [];
    let cargandoCargos = false;

    let guardando = false;
    let eliminando = false;
    let eliminandoAsignacion: string | null = null; // Key for loading state

    let toastMessage = "";
    let toastType: "success" | "error" | "info" = "info";

    let mostrarModalAsignar = false;
    let mostrarModalEliminar = false;
    let mostrarModalEliminarAsignacion = false;
    let asignacionAEliminar: Asignacion | null = null;

    onMount(async () => {
        if (profesor) {
            profesorData = { ...profesor };
            // Fix nulls
            if (!profesorData.nivel_enseñanza)
                profesorData.nivel_enseñanza = "todos";
        }
        await Promise.all([cargarCargos(), cargarAsignaciones()]);
    });

    async function cargarCargos() {
        try {
            cargos = await administrativosService.getCargos();
        } catch {}
    }

    async function cargarAsignaciones() {
        cargandoAsignaciones = true;
        try {
            asignaciones = await profesoresService.getAsignaciones(
                profesor.id_profesor,
            );
        } catch (error) {
            console.error("Error cargando asignaciones", error);
        } finally {
            cargandoAsignaciones = false;
        }
    }

    async function guardar() {
        guardando = true;
        try {
            const data = {
                ...profesorData, // Includes basic fields
                ci: profesorData.ci?.trim(),
                nombres: profesorData.nombres?.trim(),
                apellido_paterno: profesorData.apellido_paterno?.trim(),
                id_cargo: profesorData.id_cargo
                    ? Number(profesorData.id_cargo)
                    : null,
                anos_experiencia: Number(profesorData.anos_experiencia) || 0,
                direccion: profesorData.direccion?.trim() || null,
            };

            // 1. Update Professor Details
            const saved = await profesoresService.updateProfesor(
                profesor.id_profesor,
                data,
            );

            // 2. Process Pending Assignments (Additions)
            if (asignacionesPendientes.length > 0) {
                await Promise.all(
                    asignacionesPendientes.map((a) =>
                        profesoresService.asignarCursoMateria({
                            id_profesor: profesor.id_profesor,
                            id_curso: a.id_curso,
                            id_materia: a.id_materia,
                        }),
                    ),
                );
            }

            // 3. Process Pending Deletions
            if (asignacionesEliminar.length > 0) {
                await Promise.all(
                    asignacionesEliminar.map((a) =>
                        profesoresService.eliminarAsignacion(
                            profesor.id_profesor,
                            a.id_curso,
                            a.id_materia,
                        ),
                    ),
                );
            }

            // Clear queues
            asignacionesPendientes = [];
            asignacionesEliminar = [];
            await cargarAsignaciones(); // Refresh to be safe

            toastMessage = "Profesor y carga académica actualizados";
            toastType = "success";
            setTimeout(() => {
                dispatch("save", saved);
            }, 1000);
        } catch (error: any) {
            console.error(error);
            toastMessage = error.message || "Error al actualizar";
            toastType = "error";
        } finally {
            guardando = false;
        }
    }

    async function eliminarProfesor() {
        mostrarModalEliminar = true;
    }

    async function confirmarEliminacion() {
        eliminando = true;
        try {
            await profesoresService.deleteProfesor(profesor.id_profesor);
            toastMessage = "Profesor eliminado";
            toastType = "success";
            mostrarModalEliminar = false;
            setTimeout(() => {
                dispatch("delete", { id: profesor.id_profesor });
            }, 1000);
        } catch (error: any) {
            toastMessage = error.message || "Error al eliminar";
            toastType = "error";
            mostrarModalEliminar = false;
        } finally {
            eliminando = false;
        }
    }

    function confirmarEliminarAsignacion(items: Asignacion) {
        asignacionAEliminar = items;
        mostrarModalEliminarAsignacion = true;
    }

    async function eliminarAsignacion() {
        if (!asignacionAEliminar) return;

        const items = asignacionAEliminar;

        // Remove from UI
        asignaciones = asignaciones.filter(
            (a) =>
                !(
                    a.id_curso === items.id_curso &&
                    a.id_materia === items.id_materia
                ),
        );

        // Check if it was a pending addition
        const pendingIdx = asignacionesPendientes.findIndex(
            (a) =>
                a.id_curso === items.id_curso &&
                a.id_materia === items.id_materia,
        );

        if (pendingIdx >= 0) {
            // It was new, just remove from pending list
            asignacionesPendientes.splice(pendingIdx, 1);
        } else {
            // It was existing, add to delete queue
            asignacionesEliminar.push(items);
        }

        toastMessage = "Asignación eliminada (pendiente de guardar)";
        toastType = "info";
        mostrarModalEliminarAsignacion = false;
        asignacionAEliminar = null;
    }

    function handleAsignacionGuardada(e: CustomEvent<any>) {
        const item = e.detail;
        // Verify duplicates in displayed list (which includes existing + pending)
        const exists = asignaciones.some(
            (a) =>
                a.id_curso === item.id_curso &&
                a.id_materia === item.id_materia,
        );

        if (exists) {
            toastMessage = "Esta asignación ya existe en la lista";
            toastType = "error";
            return;
        }

        // Add to view
        const newAsignacion: Asignacion = {
            id_profesor: profesor.id_profesor,
            id_curso: item.id_curso,
            id_materia: item.id_materia,
            nombre_profesor: "",
            nombre_curso: item.nombre_curso,
            nombre_materia: item.nombre_materia,
        };

        asignaciones = [...asignaciones, newAsignacion];
        asignacionesPendientes.push(newAsignacion);

        mostrarModalAsignar = false;
        toastMessage = "Asignación agregada (pendiente de guardar)";
        toastType = "info";
    }
</script>

<div class="editar-profesor-container">
    <div class="editar-profesor">
        <div class="header">
            <div class="icon-title">
                <div class="icon">
                    {@html getIconSvg("edit")}
                </div>
                <div>
                    <h2>Editar Profesor</h2>
                    <p>{profesor.nombres} {profesor.apellido_paterno}</p>
                </div>
            </div>
            <div class="actions">
                <button
                    class="btn-delete"
                    on:click={eliminarProfesor}
                    disabled={eliminando || guardando}
                >
                    {#if eliminando}Eliminando...{:else}Eliminar{/if}
                </button>
                <button
                    class="btn-outline"
                    on:click={() => dispatch("cancel")}
                    disabled={guardando}>Cancelar</button
                >
                <button
                    class="btn-primary"
                    on:click={guardar}
                    disabled={guardando}
                >
                    {#if guardando}Guardando...{:else}Actualizar{/if}
                </button>
            </div>
        </div>

        <div class="content-grid">
            <!-- COLUMNA IZQUIERDA: FORMULARIO -->
            <div class="form-column">
                <section>
                    <h3>Datos Personales</h3>
                    <div class="form-row single">
                        <div class="form-group">
                            <label>CI</label>
                            <input
                                type="text"
                                bind:value={profesorData.ci}
                                disabled={guardando}
                            />
                        </div>
                        <div class="form-group">
                            <label>Estado Laboral</label>
                            <select
                                bind:value={profesorData.estado_laboral}
                                disabled={guardando}
                            >
                                <option value="activo">Activo</option>
                                <option value="retirado">Inactivo</option>
                                <option value="licencia">Licencia</option>
                                <option value="suspendido">Suspendido</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nombres</label>
                            <input
                                type="text"
                                bind:value={profesorData.nombres}
                                disabled={guardando}
                            />
                        </div>
                    </div>
                    <div class="form-row single">
                        <div class="form-group">
                            <label>Apellido Paterno</label>
                            <input
                                type="text"
                                bind:value={profesorData.apellido_paterno}
                                disabled={guardando}
                            />
                        </div>
                        <div class="form-group">
                            <label>Apellido Materno</label>
                            <input
                                type="text"
                                bind:value={profesorData.apellido_materno}
                                disabled={guardando}
                            />
                        </div>
                    </div>
                    <div class="form-row single">
                        <div class="form-group">
                            <label>Correo</label>
                            <input
                                type="email"
                                bind:value={profesorData.correo}
                                disabled={guardando}
                            />
                        </div>
                        <div class="form-group">
                            <label>Teléfono</label>
                            <input
                                type="tel"
                                bind:value={profesorData.telefono}
                                disabled={guardando}
                            />
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Dirección</label>
                            <input
                                type="text"
                                bind:value={profesorData.direccion}
                                placeholder="Ej: Av. Principal #123"
                                disabled={guardando}
                            />
                        </div>
                    </div>
                </section>

                <br />

                <section>
                    <h3>Perfil Académico</h3>
                    <div class="form-row single">
                        <div class="form-group">
                            <label>Especialidad</label>
                            <input
                                type="text"
                                bind:value={profesorData.especialidad}
                                disabled={guardando}
                            />
                        </div>
                        <div class="form-group">
                            <label>Nivel de Enseñanza</label>
                            <select
                                bind:value={profesorData.nivel_enseñanza}
                                disabled={guardando}
                            >
                                <option value="todos">Todos</option>
                                <option value="foundation">Inicial</option>
                                <option value="primary">Primaria</option>
                                <option value="secondary">Secundaria</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row single">
                        <div class="form-group">
                            <label>Título</label>
                            <input
                                type="text"
                                bind:value={profesorData.titulo_academico}
                                disabled={guardando}
                            />
                        </div>
                        <div class="form-group">
                            <label>Años Exp.</label>
                            <input
                                type="number"
                                bind:value={profesorData.anos_experiencia}
                                disabled={guardando}
                            />
                        </div>
                    </div>
                    <div class="form-row single">
                        <div class="form-group">
                            <label>Fecha de Ingreso</label>
                            <input
                                type="date"
                                bind:value={profesorData.fecha_ingreso}
                                disabled={guardando}
                            />
                        </div>
                        <div class="form-group">
                            <label>Cargo</label>
                            <select
                                bind:value={profesorData.id_cargo}
                                disabled={guardando || cargandoCargos}
                            >
                                <option value={null}>Sin cargo</option>
                                {#each cargos as cargo}
                                    <option value={cargo.id_cargo}
                                        >{cargo.nombre_cargo}</option
                                    >
                                {/each}
                            </select>
                        </div>
                    </div>
                </section>
            </div>

            <!-- COLUMNA DERECHA: ASIGNACIONES -->
            <div class="assignments-column">
                <section class="full-height">
                    <div class="assignments-header">
                        <h3>Carga Académica</h3>
                        <button
                            class="btn-small-primary"
                            on:click={() => (mostrarModalAsignar = true)}
                        >
                            + Asignar
                        </button>
                    </div>

                    <div class="assignments-list">
                        {#if cargandoAsignaciones}
                            <p class="muted">Cargando...</p>
                        {:else if asignaciones.length === 0}
                            <div class="empty-assignments">
                                <p>Sin asignaciones activas</p>
                            </div>
                        {:else}
                            {#each asignaciones as a}
                                <div class="assignment-item">
                                    <div class="asig-info">
                                        <span class="materia"
                                            >{a.nombre_materia}</span
                                        >
                                        <span class="curso"
                                            >{a.nombre_curso}</span
                                        >
                                    </div>
                                    <button
                                        class="btn-icon-delete"
                                        disabled={eliminandoAsignacion ===
                                            `${a.id_curso}-${a.id_materia}`}
                                        on:click={() =>
                                            confirmarEliminarAsignacion(a)}
                                    >
                                        {@html getIconSvg("trash")}
                                    </button>
                                </div>
                            {/each}
                        {/if}
                    </div>
                </section>
            </div>
        </div>
    </div>
</div>

{#if mostrarModalAsignar}
    <AsignarCursos
        {profesor}
        on:close={() => (mostrarModalAsignar = false)}
        on:saved={handleAsignacionGuardada}
    />
{/if}

{#if mostrarModalEliminar}
    <div class="modal-backdrop" transition:fade={{ duration: 200 }}>
        <div
            class="modal-content confirm-modal"
            transition:scale={{
                duration: 250,
                opacity: 0.9,
                start: 0.95,
                easing: quintOut,
            }}
        >
            <div class="modal-body confirm-content">
                <div class="warning-icon">
                    {@html getIconSvg("alert-triangle")}
                </div>
                <h2>¿Eliminar profesor?</h2>
                <p class="warning-text">
                    Estás a punto de eliminar a <strong
                        >{profesor.nombres} {profesor.apellido_paterno}</strong
                    >. Esta acción no se puede deshacer.
                </p>

                <div class="form-actions split">
                    <button
                        class="btn-secondary"
                        on:click={() => (mostrarModalEliminar = false)}
                        disabled={eliminando}
                    >
                        Cancelar
                    </button>
                    <button
                        class="btn-danger"
                        on:click={confirmarEliminacion}
                        disabled={eliminando}
                    >
                        {#if eliminando}
                            <span class="spinner-sm"></span>
                            <span>Eliminando...</span>
                        {:else}
                            {@html getIconSvg("trash")}
                            Eliminar definitivamente
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

{#if mostrarModalEliminarAsignacion && asignacionAEliminar}
    <div class="modal-backdrop" transition:fade={{ duration: 200 }}>
        <div
            class="modal-content confirm-modal"
            transition:scale={{
                duration: 250,
                opacity: 0.9,
                start: 0.95,
                easing: quintOut,
            }}
        >
            <div class="modal-body confirm-content">
                <div class="warning-icon delete-assignment">
                    {@html getIconSvg("trash-2")}
                </div>
                <h2>¿Quitar asignación?</h2>
                <p class="warning-text">
                    Estás a punto de quitar la asignación de <strong
                        >{asignacionAEliminar.nombre_materia}</strong
                    >
                    en <strong>{asignacionAEliminar.nombre_curso}</strong>. Esta
                    acción quedará pendiente hasta que guardes los cambios.
                </p>

                <div class="form-actions split">
                    <button
                        class="btn-secondary"
                        on:click={() => {
                            mostrarModalEliminarAsignacion = false;
                            asignacionAEliminar = null;
                        }}
                    >
                        Cancelar
                    </button>
                    <button class="btn-danger" on:click={eliminarAsignacion}>
                        {@html getIconSvg("trash")}
                        Quitar asignación
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<Toast message={toastMessage} type={toastType} />

<style>
    .editar-profesor-container {
        background: #f8fafc;
        padding: 0 20px 20px 20px;
        margin-top: 20px;
    }

    .editar-profesor {
        background: #fff;
        border-radius: 12px;
        /* Padding removed from here */
        padding: 0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        max-width: 1100px;
        margin: 0 auto;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #e2e8f0;
        position: sticky;
        top: 0;
        background: white;
        z-index: 100;
        padding: 20px 24px;
        margin: 0;
        /* Removed top border radius to look better when stuck */
        border-radius: 12px 12px 0 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .icon-title {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .icon {
        width: 40px;
        height: 40px;
        background: #e6f7fa;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #00cfe6;
    }

    .icon :global(svg) {
        width: 20px;
        height: 20px;
    }

    h2 {
        margin: 0;
        font-size: 1.15rem;
        color: #1e293b;
    }

    .actions {
        display: flex;
        gap: 10px;
    }

    .content-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 24px;
        /* Padding added here */
        padding: 24px;
    }

    @media (max-width: 800px) {
        .content-grid {
            grid-template-columns: 1fr;
        }
    }

    section {
        background: #fafbfc;
        padding: 18px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }

    .full-height {
        height: 100%;
        box-sizing: border-box;
    }

    h3 {
        margin: 0 0 16px;
        font-size: 1rem;
        color: #334155;
        font-weight: 600;
    }

    /* Form styles similar to Create */
    .form-row {
        display: grid;
        gap: 16px;
        margin-bottom: 12px;
    }
    .form-row.single {
        grid-template-columns: 1fr 1fr;
    }
    .form-group {
        display: flex;
        flex-direction: column;
    }
    label {
        margin-bottom: 6px;
        font-size: 0.85rem;
        color: #475569;
    }
    input,
    select {
        padding: 8px 10px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 0.9rem;
    }

    /* Assignments */
    .assignments-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }

    .btn-small-primary {
        background: #00cfe6;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 18px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(0, 207, 230, 0.25);
    }
    .btn-small-primary:hover {
        background: #00b8d4;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 207, 230, 0.35);
    }

    .assignment-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: white;
        border: 1px solid #e2e8f0;
        padding: 10px;
        border-radius: 8px;
        margin-bottom: 8px;
    }

    .asig-info {
        display: flex;
        flex-direction: column;
    }

    .materia {
        font-weight: 600;
        font-size: 0.9rem;
        color: #1e293b;
    }
    .curso {
        font-size: 0.8rem;
        color: #64748b;
    }

    .btn-icon-delete {
        background: transparent;
        border: none;
        color: #ef4444;
        cursor: pointer;
        opacity: 0.7;
    }
    .btn-icon-delete:hover {
        opacity: 1;
    }
    .btn-icon-delete svg {
        width: 16px;
        height: 16px;
    }

    .btn-primary {
        background: #00cfe6;
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
    }
    .btn-outline {
        background: white;
        color: #64748b;
        padding: 10px 20px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        cursor: pointer;
    }
    .btn-delete {
        background: #fee2e2;
        color: #ef4444;
        padding: 10px 20px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
    }

    /* ==================== MODAL STYLES ==================== */
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
    .modal-content.confirm-modal {
        background: white;
        border-radius: 24px;
        width: 100%;
        max-width: 420px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.8);
    }
    .modal-body.confirm-content {
        padding: 40px 32px;
        text-align: center;
    }
    .warning-icon {
        color: #ef4444;
        margin-bottom: 24px;
        background: #fef2f2;
        width: 80px;
        height: 80px;
        border-radius: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: auto;
        margin-right: auto;
    }
    .warning-icon :global(svg) {
        width: 40px;
        height: 40px;
    }
    .warning-icon.delete-assignment {
        background: #fff7ed;
        color: #f59e0b;
    }
    .modal-body h2 {
        font-size: 1.5rem;
        color: #1e293b;
        margin: 0 0 12px 0;
        font-weight: 700;
    }
    .warning-text {
        color: #64748b;
        font-size: 1rem;
        line-height: 1.5;
        margin-bottom: 32px;
    }
    .form-actions.split {
        display: flex;
        justify-content: center;
        gap: 16px;
    }
    .btn-secondary {
        background: white;
        color: #64748b;
        border: 1px solid #e2e8f0;
        padding: 12px 24px;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        font-size: 1rem;
        transition: all 0.2s;
    }
    .btn-secondary:hover {
        background: #f1f5f9;
        color: #1e293b;
    }
    .btn-danger {
        background: #ef4444;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
        transition: all 0.2s;
    }
    .btn-danger:hover {
        background: #dc2626;
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(239, 68, 68, 0.35);
    }
    .btn-danger:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
    }
    .spinner-sm {
        width: 18px;
        height: 18px;
        box-sizing: border-box;
        border: 2px solid #ffffff;
        border-top: 2px solid transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        display: block;
    }
</style>
