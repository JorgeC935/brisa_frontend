<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import type { Profesor, Asignacion } from "$lib/services/profesores.js";
    import { profesoresService } from "$lib/services/profesores.js";
    import { administrativosService } from "$lib/services/administrativos.js";

    export let profesor: Profesor;

    const dispatch = createEventDispatcher<{
        cancel: void;
        edit: void;
    }>();

    let asignaciones: Asignacion[] = [];
    let cargoName = "";
    let isLoadingCarga = true;

    onMount(async () => {
        loadData();
        if (profesor.id_cargo) {
            try {
                const c = await administrativosService.getCargo(
                    profesor.id_cargo,
                );
                cargoName = c.nombre_cargo;
            } catch {}
        }
    });

    async function loadData() {
        isLoadingCarga = true;
        try {
            asignaciones = await profesoresService.getAsignaciones(
                profesor.id_profesor,
            );
        } catch {
            asignaciones = [];
        } finally {
            isLoadingCarga = false;
        }
    }
</script>

<div class="detalles-profesor-container">
    <div class="panel">
        <!-- HEADER -->
        <div class="header">
            <div class="profile-summary">
                <div class="avatar">
                    {profesor.nombres[0]}{profesor.apellido_paterno[0]}
                </div>
                <div class="titles">
                    <h2>
                        {profesor.nombres}
                        {profesor.apellido_paterno}
                        {profesor.apellido_materno || ""}
                    </h2>
                    <p class="subtitle">
                        {profesor.titulo_academico || "Docente"}
                    </p>
                    <span
                        class="status {profesor.estado_laboral?.toLowerCase()}"
                    >
                        {profesor.estado_laboral === "retirado"
                            ? "Inactivo"
                            : profesor.estado_laboral}
                    </span>
                </div>
            </div>
            <div class="actions">
                <button class="btn-outline" on:click={() => dispatch("cancel")}
                    >Volver</button
                >
                <button class="btn-primary" on:click={() => dispatch("edit")}
                    >Editar</button
                >
            </div>
        </div>

        <hr />

        <div class="grid-content">
            <!-- INFO SECTION -->
            <div class="info-section">
                <h3>Información Personal</h3>
                <div class="field-grid">
                    <div class="field">
                        <label>CI</label>
                        <span>{profesor.ci}</span>
                    </div>
                    <div class="field">
                        <label>Correo</label>
                        <span>{profesor.correo || "-"}</span>
                    </div>
                    <div class="field">
                        <label>Teléfono</label>
                        <span>{profesor.telefono || "-"}</span>
                    </div>
                    <div class="field">
                        <label>Dirección</label>
                        <span>{profesor.direccion || "-"}</span>
                    </div>
                </div>

                <h3 class="mt-4">Datos Laborales</h3>
                <div class="field-grid">
                    <div class="field">
                        <label>Especialidad</label>
                        <span>{profesor.especialidad || "-"}</span>
                    </div>
                    <div class="field">
                        <label>Nivel Enseñanza</label>
                        <span>{profesor.nivel_enseñanza || "General"}</span>
                    </div>
                    <div class="field">
                        <label>Años Experiencia</label>
                        <span>{profesor.anos_experiencia || 0} años</span>
                    </div>
                    <div class="field">
                        <label>Cargo</label>
                        <span>{cargoName || "-"}</span>
                    </div>
                    <div class="field">
                        <label>Fecha Ingreso</label>
                        <span>{profesor.fecha_ingreso || "-"}</span>
                    </div>
                </div>
            </div>

            <!-- ASIGNACIONES SECTION -->
            <div class="assignments-section">
                <h3>Carga Académica Actual</h3>
                <div class="assignments-list">
                    {#if isLoadingCarga}
                        <div class="skeleton-loader">
                            <div class="skeleton-card"></div>
                            <div class="skeleton-card"></div>
                            <div class="skeleton-card"></div>
                        </div>
                    {:else if asignaciones.length === 0}
                        <div class="empty">Sin asignaciones registradas.</div>
                    {:else}
                        {#each asignaciones as a}
                            <div class="assignment-card">
                                <div class="course-badge">{a.nombre_curso}</div>
                                <div class="subject-name">
                                    {a.nombre_materia}
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .detalles-profesor-container {
        background: #f8fafc;
        padding: 20px;
    }

    .panel {
        background: white;
        border-radius: 12px;
        padding: 30px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        max-width: 1000px;
        margin: 0 auto;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
    }

    .profile-summary {
        display: flex;
        gap: 20px;
        align-items: center;
    }

    .avatar {
        width: 80px;
        height: 80px;
        background: #6366f1;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        font-weight: bold;
    }

    .titles h2 {
        margin: 0;
        color: #1e293b;
        font-size: 1.5rem;
    }

    .subtitle {
        color: #64748b;
        margin: 4px 0 8px;
    }

    .status {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: capitalize;
    }

    .status.activo {
        background: #ecfdf5;
        color: #16a34a;
    }
    .status.inactivo {
        background: #fffbeb;
        color: #d97706;
    }
    .status.licencia {
        background: #eff6ff;
        color: #3b82f6;
    }

    .actions {
        display: flex;
        gap: 10px;
    }

    .btn-primary {
        background: #00cfe6;
        color: white;
        padding: 10px 24px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        font-weight: 500;
    }
    .btn-outline {
        background: white;
        color: #64748b;
        padding: 10px 24px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        cursor: pointer;
        font-weight: 500;
    }

    hr {
        border: none;
        border-top: 1px solid #e2e8f0;
        margin: 24px 0;
    }

    .grid-content {
        display: grid;
        grid-template-columns: 1.5fr 1fr;
        gap: 40px;
    }

    h3 {
        color: #334155;
        margin: 0 0 16px;
        font-size: 1.1rem;
        font-weight: 600;
    }

    .mt-4 {
        margin-top: 24px;
    }

    .field-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
    }

    .field label {
        display: block;
        font-size: 0.8rem;
        color: #94a3b8;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .field span {
        color: #1e293b;
        font-weight: 500;
        font-size: 1rem;
    }

    .assignments-section {
        background: #f8fafc;
        padding: 20px;
        border-radius: 12px;
    }

    .assignments-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .assignment-card {
        background: white;
        padding: 12px 16px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    /* Skeleton Loader */
    .skeleton-loader {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .skeleton-card {
        height: 50px;
        background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
        );
        background-size: 200% 100%;
        border-radius: 8px;
        animation: loading 1.5s infinite;
    }

    @keyframes loading {
        0% {
            background-position: 200% 0;
        }
        100% {
            background-position: -200% 0;
        }
    }

    .course-badge {
        background: #e0f2fe;
        color: #0284c7;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.9rem;
    }

    .subject-name {
        font-weight: 500;
        color: #334155;
    }

    .empty {
        color: #94a3b8;
        font-style: italic;
        text-align: center;
        padding: 20px;
    }

    @media (max-width: 800px) {
        .grid-content {
            grid-template-columns: 1fr;
        }
    }
</style>
