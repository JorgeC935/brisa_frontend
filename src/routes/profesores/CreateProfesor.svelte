<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import Toast from "$lib/components/Toast.svelte";
    import {
        profesoresService,
        type Profesor,
    } from "$lib/services/profesores.js";
    import { administrativosService } from "$lib/services/administrativos.js";
    import { coursesService } from "$lib/services/courses.js";
    import { academicService } from "$lib/services/academic.js";
    import { getIconSvg } from "$lib/components/svg.js";

    const dispatch = createEventDispatcher<{
        save: Profesor;
        cancel: void;
    }>();

    let profesor: any = {
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

    let formErrors = {
        ci: false,
        nombres: false,
        apellido_paterno: false,
        correo: false,
        id_cargo: false,
    };

    let errorMessages = {
        ci: "",
        nombres: "",
        apellido_paterno: "",
        correo: "",
        id_cargo: "",
    };

    let cargos: any[] = [];
    let cargandoCargos = false;

    // Asignaciones
    let cursos: any[] = [];
    let materias: any[] = [];
    let asignaciones: any[] = []; // { id_curso, id_materia, nombre_curso, nombre_materia }
    let selectedCursoId: number | null = null;
    let selectedMateriaId: number | null = null;

    let guardando = false;
    let toastMessage = "";
    let toastType: "success" | "error" | "info" = "info";

    onMount(async () => {
        await Promise.all([cargarCargos(), cargarDatosAcademicos()]);
    });

    async function cargarDatosAcademicos() {
        try {
            const [coursesRes, subjectsRes] = await Promise.all([
                coursesService.getCourses(),
                academicService.getReporteMateriasPorNivel(),
            ]);
            cursos = Array.isArray(coursesRes)
                ? coursesRes
                : coursesRes.data || [];
            materias = subjectsRes.materias || [];
        } catch (e) {
            console.error("Error cargando datos académicos", e);
        }
    }

    async function cargarCargos() {
        cargandoCargos = true;
        try {
            cargos = await administrativosService.getCargos();
        } catch (error: any) {
            console.error("Error cargando cargos:", error);
        } finally {
            cargandoCargos = false;
        }
    }

    function validarCampo(campo: string, valor: any) {
        switch (campo) {
            case "ci":
                if (!valor || valor.trim() === "") {
                    formErrors.ci = true;
                    errorMessages.ci = "El CI es obligatorio";
                } else if (valor.trim().length < 5) {
                    formErrors.ci = true;
                    errorMessages.ci = "El CI debe tener al menos 5 caracteres";
                } else {
                    formErrors.ci = false;
                    errorMessages.ci = "";
                }
                break;
            case "nombres":
                if (!valor || valor.trim() === "") {
                    formErrors.nombres = true;
                    errorMessages.nombres = "Los nombres son obligatorios";
                } else {
                    formErrors.nombres = false;
                    errorMessages.nombres = "";
                }
                break;
            case "apellido_paterno":
                if (!valor || valor.trim() === "") {
                    formErrors.apellido_paterno = true;
                    errorMessages.apellido_paterno =
                        "El apellido paterno es obligatorio";
                } else {
                    formErrors.apellido_paterno = false;
                    errorMessages.apellido_paterno = "";
                }
                break;
            case "correo":
                if (valor && valor.trim() !== "") {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(valor.trim())) {
                        formErrors.correo = true;
                        errorMessages.correo =
                            "El correo electrónico no es válido";
                    } else {
                        formErrors.correo = false;
                        errorMessages.correo = "";
                    }
                } else {
                    formErrors.correo = false;
                    errorMessages.correo = "";
                }
                break;
        }
    }

    function validarForm() {
        let isValid = true;
        formErrors = {
            ci: false,
            nombres: false,
            apellido_paterno: false,
            correo: false,
            id_cargo: false,
        };

        if (!profesor.ci || profesor.ci.trim() === "") {
            validarCampo("ci", profesor.ci);
            isValid = false;
        }
        if (!profesor.nombres || profesor.nombres.trim() === "") {
            validarCampo("nombres", profesor.nombres);
            isValid = false;
        }
        if (
            !profesor.apellido_paterno ||
            profesor.apellido_paterno.trim() === ""
        ) {
            validarCampo("apellido_paterno", profesor.apellido_paterno);
            isValid = false;
        }
        if (profesor.correo && !profesor.correo.includes("@")) {
            validarCampo("correo", profesor.correo);
            isValid = false;
        }

        return isValid;
    }

    async function guardar() {
        if (!validarForm()) {
            toastMessage =
                "Por favor, complete todos los campos requeridos correctamente";
            toastType = "error";
            return;
        }

        guardando = true;

        try {
            const data = {
                ci: profesor.ci.trim(),
                nombres: profesor.nombres.trim(),
                apellido_paterno: profesor.apellido_paterno.trim(),
                apellido_materno: profesor.apellido_materno?.trim() || null,
                direccion: profesor.direccion?.trim() || null,
                telefono: profesor.telefono?.trim() || null,
                correo: profesor.correo?.trim() || null,
                id_cargo: profesor.id_cargo
                    ? Number(profesor.id_cargo)
                    : undefined,
                estado_laboral: profesor.estado_laboral || "activo",
                anos_experiencia: Number(profesor.anos_experiencia) || 0,
                fecha_ingreso: profesor.fecha_ingreso || null,

                // Profesor specific
                especialidad: profesor.especialidad?.trim() || null,
                titulo_academico: profesor.titulo_academico?.trim() || null,
                nivel_enseñanza: profesor.nivel_enseñanza || "todos",
                observaciones: profesor.observaciones?.trim() || null,
            };

            const saved = await profesoresService.createProfesor(data);

            toastMessage = "Profesor registrado exitosamente";
            toastType = "success";

            // Guardar asignaciones si existen
            if (saved && saved.id_profesor) {
                await guardarAsignaciones(saved.id_profesor);
            }

            setTimeout(() => {
                dispatch("save", saved);
                resetForm();
            }, 1000);
        } catch (error: any) {
            console.error("Error:", error);
            let errorMsg = "Error al registrar profesor";
            if (error.details?.detail) errorMsg = error.details.detail;
            else if (error.message) errorMsg = error.message;

            toastMessage = errorMsg;
            toastType = "error";
        } finally {
            guardando = false;
        }
    }

    async function guardarAsignaciones(idProfesor: number) {
        if (asignaciones.length === 0) return;

        let errores = 0;
        for (const asig of asignaciones) {
            try {
                await profesoresService.asignarCursoMateria({
                    id_profesor: idProfesor,
                    id_curso: asig.id_curso,
                    id_materia: asig.id_materia,
                });
            } catch (e) {
                console.error("Error asignando carga", e);
                errores++;
            }
        }

        if (errores > 0) {
            toastMessage = `Profesor creado, pero hubo ${errores} error(es) al asignar carga.`;
            toastType = "info";
        } else {
            toastMessage =
                "Profesor y carga académica registrados correctamente";
        }
    }

    function cancelar() {
        resetForm();
        dispatch("cancel");
    }

    function resetForm() {
        profesor = {
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
        asignaciones = [];
        selectedCursoId = null;
        selectedMateriaId = null;
    }

    function agregarAsignacion() {
        if (!selectedCursoId || !selectedMateriaId) return;

        // Verificar duplicados
        const exists = asignaciones.some(
            (a) =>
                a.id_curso === selectedCursoId &&
                a.id_materia === selectedMateriaId,
        );
        if (exists) {
            toastMessage = "Esta asignación ya está en la lista";
            toastType = "error";
            return;
        }

        const curso = cursos.find((c) => c.id_curso === selectedCursoId);
        const materia = materias.find(
            (m) => m.id_materia === selectedMateriaId,
        );

        if (curso && materia) {
            asignaciones = [
                ...asignaciones,
                {
                    id_curso: selectedCursoId,
                    id_materia: selectedMateriaId,
                    nombre_curso: curso.nombre_curso,
                    nombre_materia: materia.nombre_materia,
                    nivel_curso: curso.nivel,
                },
            ];
            selectedCursoId = null;
            selectedMateriaId = null;
        }
    }

    function removerAsignacion(index: number) {
        asignaciones = asignaciones.filter((_, i) => i !== index);
    }
</script>

<div class="nuevo-profesor-container">
    <div class="nuevo-profesor">
        <div class="header">
            <div class="icon-title">
                <div class="icon">
                    {@html getIconSvg("graduation-cap")}
                </div>
                <div>
                    <h2>Nuevo Profesor</h2>
                    <p>Complete los datos del personal docente</p>
                </div>
            </div>
            <div class="actions">
                <button
                    class="btn-outline"
                    on:click={cancelar}
                    disabled={guardando}>Cancelar</button
                >
                <button
                    class="btn-primary"
                    on:click={guardar}
                    disabled={guardando}
                >
                    {#if guardando}
                        <span class="spinner"></span> Guardando...
                    {:else}
                        Guardar
                    {/if}
                </button>
            </div>
        </div>

        <div class="form">
            <!-- Información Personal -->
            <section>
                <h3>Información Personal</h3>
                <div class="form-row single">
                    <div class="form-group">
                        <label class:error={formErrors.ci}>CI *</label>
                        <input
                            type="text"
                            bind:value={profesor.ci}
                            on:input={() => validarCampo("ci", profesor.ci)}
                            on:blur={() => validarCampo("ci", profesor.ci)}
                            placeholder="Ej: 1234567"
                            class:error={formErrors.ci}
                            disabled={guardando}
                        />
                        {#if formErrors.ci}
                            <span class="error-message">{errorMessages.ci}</span
                            >
                        {/if}
                    </div>
                    <div class="form-group">
                        <label>Estado Laboral</label>
                        <select
                            bind:value={profesor.estado_laboral}
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
                        <label class:error={formErrors.nombres}>Nombres *</label
                        >
                        <input
                            type="text"
                            bind:value={profesor.nombres}
                            on:input={() =>
                                validarCampo("nombres", profesor.nombres)}
                            on:blur={() =>
                                validarCampo("nombres", profesor.nombres)}
                            placeholder="Ej: Juan Carlos"
                            class:error={formErrors.nombres}
                            disabled={guardando}
                        />
                        {#if formErrors.nombres}
                            <span class="error-message"
                                >{errorMessages.nombres}</span
                            >
                        {/if}
                    </div>
                </div>

                <div class="form-row single">
                    <div class="form-group">
                        <label class:error={formErrors.apellido_paterno}
                            >Apellido Paterno *</label
                        >
                        <input
                            type="text"
                            bind:value={profesor.apellido_paterno}
                            on:input={() =>
                                validarCampo(
                                    "apellido_paterno",
                                    profesor.apellido_paterno,
                                )}
                            on:blur={() =>
                                validarCampo(
                                    "apellido_paterno",
                                    profesor.apellido_paterno,
                                )}
                            placeholder="Ej: Pérez"
                            class:error={formErrors.apellido_paterno}
                            disabled={guardando}
                        />
                        {#if formErrors.apellido_paterno}
                            <span class="error-message"
                                >{errorMessages.apellido_paterno}</span
                            >
                        {/if}
                    </div>
                    <div class="form-group">
                        <label>Apellido Materno</label>
                        <input
                            type="text"
                            bind:value={profesor.apellido_materno}
                            placeholder="Ej: García"
                            disabled={guardando}
                        />
                    </div>
                </div>
            </section>

            <!-- Información de Contacto -->
            <section>
                <h3>Información de Contacto</h3>
                <div class="form-row single">
                    <div class="form-group">
                        <label class:error={formErrors.correo}
                            >Correo Electrónico</label
                        >
                        <input
                            type="email"
                            bind:value={profesor.correo}
                            on:input={() =>
                                validarCampo("correo", profesor.correo)}
                            on:blur={() =>
                                validarCampo("correo", profesor.correo)}
                            placeholder="profesor@escuela.edu"
                            class:error={formErrors.correo}
                            disabled={guardando}
                        />
                        {#if formErrors.correo}
                            <span class="error-message"
                                >{errorMessages.correo}</span
                            >
                        {/if}
                    </div>
                    <div class="form-group">
                        <label>Teléfono</label>
                        <input
                            type="tel"
                            bind:value={profesor.telefono}
                            placeholder="+591 789-0000"
                            disabled={guardando}
                        />
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Dirección</label>
                        <input
                            type="text"
                            bind:value={profesor.direccion}
                            placeholder=""
                            disabled={guardando}
                        />
                    </div>
                </div>
            </section>

            <!-- Información Académica -->
            <section>
                <h3>Información Académica</h3>
                <div class="form-row single">
                    <div class="form-group">
                        <label>Especialidad</label>
                        <input
                            type="text"
                            bind:value={profesor.especialidad}
                            placeholder="Ej: Matemáticas"
                            disabled={guardando}
                        />
                    </div>
                    <div class="form-group">
                        <label>Título Académico</label>
                        <input
                            type="text"
                            bind:value={profesor.titulo_academico}
                            placeholder="Ej: Licenciado en Educación"
                            disabled={guardando}
                        />
                    </div>
                </div>
                <div class="form-row single">
                    <div class="form-group">
                        <label>Nivel de Enseñanza</label>
                        <select
                            bind:value={profesor.nivel_enseñanza}
                            disabled={guardando}
                        >
                            <option value="todos">Todos</option>
                            <option value="foundation">Inicial</option>
                            <option value="primary">Primaria</option>
                            <option value="secondary">Secundaria</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Años de Experiencia</label>
                        <input
                            type="number"
                            bind:value={profesor.anos_experiencia}
                            min="0"
                            disabled={guardando}
                        />
                    </div>
                </div>
                <div class="form-row single">
                    <div class="form-group">
                        <label>Fecha de Ingreso</label>
                        <input
                            type="date"
                            bind:value={profesor.fecha_ingreso}
                            disabled={guardando}
                        />
                    </div>
                    <div class="form-group">
                        <label>Cargo (Opcional)</label>
                        <select
                            bind:value={profesor.id_cargo}
                            disabled={guardando || cargandoCargos}
                        >
                            <option value={null}>Seleccione un cargo...</option>
                            {#each cargos as cargo}
                                <option value={cargo.id_cargo}
                                    >{cargo.nombre_cargo}</option
                                >
                            {/each}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Observaciones</label>
                        <textarea
                            bind:value={profesor.observaciones}
                            placeholder="Observaciones adicionales..."
                            rows="3"
                            disabled={guardando}
                        ></textarea>
                    </div>
                </div>
            </section>

            <!-- Asignación de Carga Académica -->
            <section>
                <h3>Asignación de Carga Académica (Opcional)</h3>
                <div class="form-row single assignment-row">
                    <div class="form-group">
                        <label>Curso</label>
                        <select
                            bind:value={selectedCursoId}
                            disabled={guardando}
                        >
                            <option value={null}>-- Seleccionar Curso --</option
                            >
                            {#each cursos as c}
                                <option value={c.id_curso}
                                    >{c.nombre_curso} ({c.nivel})</option
                                >
                            {/each}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Materia</label>
                        <select
                            bind:value={selectedMateriaId}
                            disabled={guardando}
                        >
                            <option value={null}
                                >-- Seleccionar Materia --</option
                            >
                            {#each materias as m}
                                <option value={m.id_materia}
                                    >{m.nombre_materia} ({m.nivel})</option
                                >
                            {/each}
                        </select>
                    </div>
                    <div class="form-group btn-add-container">
                        <label>&nbsp;</label>
                        <button
                            class="btn-add"
                            on:click={agregarAsignacion}
                            disabled={guardando ||
                                !selectedCursoId ||
                                !selectedMateriaId}
                        >
                            + Agregar
                        </button>
                    </div>
                </div>

                {#if asignaciones.length > 0}
                    <div class="assignment-list">
                        <h4>Asignaciones agregadas:</h4>
                        <div class="list-container">
                            {#each asignaciones as asig, i}
                                <div class="assignment-item">
                                    <span class="asig-text">
                                        <strong>{asig.nombre_materia}</strong>
                                        en {asig.nombre_curso}
                                    </span>
                                    <button
                                        class="btn-remove"
                                        on:click={() => removerAsignacion(i)}
                                        disabled={guardando}
                                    >
                                        &times;
                                    </button>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </section>
        </div>
    </div>
</div>

<Toast message={toastMessage} type={toastType} />

<style>
    .nuevo-profesor-container {
        background: #f8fafc;
        padding: 0 20px 20px 20px;
        margin-top: 20px;
    }

    .nuevo-profesor {
        background: #fff;
        border-radius: 12px;
        /* Padding removed from here */
        padding: 0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        max-width: 900px;
        margin: 0 auto;
        min-height: fit-content;
    }

    .form {
        display: flex;
        flex-direction: column;
        gap: 20px;
        /* Padding added here */
        padding: 24px;
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

    h2 + p {
        margin: 2px 0 0;
        color: #64748b;
        font-size: 0.85rem;
    }

    .actions {
        display: flex;
        gap: 12px;
    }

    .btn-outline,
    .btn-primary {
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 0.9rem;
        cursor: pointer;
        border: none;
        font-weight: 500;
        transition: all 0.2s;
    }

    .btn-outline {
        background: #fff;
        color: #64748b;
        border: 1.5px solid #e2e8f0;
    }

    .btn-outline:hover:not(:disabled) {
        background: #f8fafc;
    }

    .btn-primary {
        background: #00cfe6;
        color: #fff;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .btn-primary:hover:not(:disabled) {
        background: #00b8d4;
    }

    .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    section {
        background: #fafbfc;
        padding: 18px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }

    section h3 {
        margin: 0 0 16px;
        font-size: 0.95rem;
        color: #1e293b;
        font-weight: 600;
    }

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
        font-weight: 500;
    }

    label.error {
        color: #ef4444;
    }

    input,
    select,
    textarea {
        padding: 10px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 0.9rem;
        color: #1e293b;
    }

    input:focus,
    select:focus,
    textarea:focus {
        outline: none;
        border-color: #00cfe6;
    }

    input.error,
    select.error {
        border-color: #ef4444;
    }

    .error-message {
        color: #ef4444;
        font-size: 0.75rem;
        margin-top: 4px;
    }

    .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-top: 2px solid transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    /* Asignaciones Styles */
    .assignment-row {
        display: grid;
        grid-template-columns: 2fr 2fr 1fr;
        gap: 12px;
        align-items: center;
    }

    .btn-add-container {
        display: flex;
        justify-content: center;
        align-items: flex-end;
        height: 100%;
    }

    .btn-add {
        background: #00cfe6;
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        height: 42px; /* Match input height */
        width: 100%;
        transition: all 0.2s;
        box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .btn-add:hover:not(:disabled) {
        background: #00b8d4;
        transform: translateY(-1px);
    }

    .btn-add:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        box-shadow: none;
    }

    .assignment-list {
        margin-top: 20px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
    }

    .assignment-list h4 {
        margin: 0 0 12px;
        font-size: 0.9rem;
        color: #475569;
    }

    .list-container {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
    }

    .assignment-item {
        background: #f1f5f9;
        padding: 6px 12px;
        border-radius: 99px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        color: #334155;
        border: 1px solid #e2e8f0;
    }

    .btn-remove {
        background: #fee2e2;
        color: #ef4444;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        cursor: pointer;
        line-height: 1;
        padding: 0;
    }

    .btn-remove:hover {
        background: #fecaca;
    }
</style>
