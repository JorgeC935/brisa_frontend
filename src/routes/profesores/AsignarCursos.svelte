<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { fade, scale } from "svelte/transition";
    import {
        profesoresService,
        type Profesor,
    } from "$lib/services/profesores.js";
    import { coursesService } from "$lib/services/courses.js";
    import { academicService } from "$lib/services/academic.js";

    export let profesor: Profesor;

    const dispatch = createEventDispatcher<{
        close: void;
        saved: any; // payload with assignment details
    }>();

    let cursos: any[] = [];
    let materias: any[] = [];

    let selectedCursoId: number | null = null;
    let selectedMateriaId: number | null = null;

    let loadingData = false;
    let saving = false;
    let error = "";

    onMount(async () => {
        loadingData = true;
        try {
            // Fetch Cursos
            const coursesResponse: any = await coursesService.getCourses();
            // Assuming coursesService returns array or { data: array }?
            // Checking curso_controller.py: returns List[CursoDTO].
            // courses.ts returns http.get -> usually the body directly.
            cursos = Array.isArray(coursesResponse)
                ? coursesResponse
                : coursesResponse.data || [];

            // Fetch Materias
            // academicService.getReporteMateriasPorNivel() returns { materias: [], total: ... }
            const materiasResponse =
                await academicService.getReporteMateriasPorNivel();
            materias = materiasResponse.materias || [];
        } catch (e: any) {
            console.error(e);
            error = "Error cargando listas de cursos/materias";
        } finally {
            loadingData = false;
        }
    });

    function guardar() {
        if (!selectedCursoId || !selectedMateriaId) return;

        const curso = cursos.find((c) => c.id_curso === selectedCursoId);
        const materia = materias.find(
            (m) => m.id_materia === selectedMateriaId,
        );

        if (curso && materia) {
            dispatch("saved", {
                id_curso: selectedCursoId,
                id_materia: selectedMateriaId,
                nombre_curso: curso.nombre_curso,
                nombre_materia: materia.nombre_materia,
                nivel: curso.nivel,
            });
        }
    }
</script>

<div class="modal-backdrop" on:click={() => dispatch("close")} transition:fade>
    <div class="modal-content" on:click|stopPropagation transition:scale>
        <div class="modal-header">
            <h3>Asignar Carga Académica</h3>
            <button class="btn-close" on:click={() => dispatch("close")}
                >&times;</button
            >
        </div>

        <div class="modal-body">
            {#if loadingData}
                <div class="loading">Cargando datos...</div>
            {:else}
                {#if error}
                    <div class="error-alert">{error}</div>
                {/if}

                <div class="form-group">
                    <label>Seleccione Curso</label>
                    <select bind:value={selectedCursoId}>
                        <option value={null}>-- Seleccionar Curso --</option>
                        {#each cursos as c}
                            <option value={c.id_curso}
                                >{c.nombre_curso} ({c.nivel})</option
                            >
                        {/each}
                    </select>
                </div>

                <div class="form-group">
                    <label>Seleccione Materia</label>
                    <select bind:value={selectedMateriaId}>
                        <option value={null}>-- Seleccionar Materia --</option>
                        {#each materias as m}
                            <option value={m.id_materia}
                                >{m.nombre_materia} ({m.nivel})</option
                            >
                        {/each}
                    </select>
                </div>
            {/if}
        </div>

        <div class="modal-footer">
            <button
                class="btn-cancel"
                on:click={() => dispatch("close")}
                disabled={saving}>Cancelar</button
            >
            <button
                class="btn-save"
                on:click={guardar}
                disabled={!selectedCursoId || !selectedMateriaId}
            >
                Asignar
            </button>
        </div>
    </div>
</div>

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
    }

    .modal-content {
        background: white;
        width: 100%;
        max-width: 500px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        overflow: hidden;
    }

    .modal-header {
        padding: 16px 20px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-header h3 {
        margin: 0;
        font-size: 1.1rem;
        color: #1e293b;
    }

    .btn-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #64748b;
    }

    .modal-body {
        padding: 20px;
    }

    .form-group {
        margin-bottom: 16px;
    }

    .form-group label {
        display: block;
        margin-bottom: 6px;
        font-size: 0.9rem;
        color: #475569;
        font-weight: 500;
    }

    select {
        width: 100%;
        padding: 10px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 0.95rem;
        background: white;
    }

    .modal-footer {
        padding: 16px 20px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }

    .btn-cancel {
        padding: 8px 16px;
        border: 1px solid #cbd5e1;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        color: #475569;
        font-weight: 500;
    }

    .btn-save {
        padding: 8px 16px;
        background: #00cfe6;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
    }

    .btn-save:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .error-alert {
        background: #fee2e2;
        color: #ef4444;
        padding: 10px;
        border-radius: 6px;
        margin-bottom: 16px;
        font-size: 0.9rem;
    }

    .loading {
        text-align: center;
        color: #64748b;
        padding: 20px;
    }
</style>
