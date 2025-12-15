<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { text } from "@sveltejs/kit";
    import { goto } from "$app/navigation";
    import {
        profesoresService,
        type Profesor,
    } from "$lib/services/profesores.js";
    import { coursesService } from "$lib/services/courses.js";
    import { academicService } from "$lib/services/academic.js";
    import {
        administrativosService,
        type Cargo,
    } from "$lib/services/administrativos.js"; // Reusing for cargos if needed
    import { getIconSvg } from "$lib/components/svg.js";
    import CreateProfesor from "./CreateProfesor.svelte";
    import EditarProfesor from "./EditarProfesor.svelte";
    import DetallesProfesor from "./DetallesProfesor.svelte";

    const POLLING_INTERVAL = 5000;
    const FAST_POLLING_INTERVAL = 2000;

    // ==================== ESTADO ====================
    let profesores: Profesor[] = [];
    let cargos: Cargo[] = []; // If professors use same cargos table
    let cargoSeleccionado = "todos";
    let estadoSeleccionado = "todos";
    let materiaSeleccionada = "todas";
    let searchQuery = "";
    let mostrarNuevo = false;
    let mostrarEditar = false;
    let mostrarDetalles = false;
    let profesorSeleccionado: Profesor | null = null;
    let isLoading = true; // Start loading immediately
    let hasChanges = false;
    let polling: number | null = null;
    let isMounted = false;
    let fileInput: HTMLInputElement;

    // Modal states para importación
    let mostrarModalConfirmImport = false;
    let mostrarModalImportResult = false;
    let mostrarModalImportError = false;
    let archivoAImportar: File | null = null;
    let importResultMessage = "";
    let importErrorMessage = "";

    // ==================== UTILIDADES ====================
    function hash(data: any) {
        return JSON.stringify(data)
            .split("")
            .reduce((a, b) => (a = (a << 5) - a + b.charCodeAt(0)) & a, 0)
            .toString();
    }

    function initials(p: Profesor) {
        const ap = p.apellido_paterno?.[0] || p.apellido_materno?.[0] || "";
        const n = p.nombres.split(" ")[0]?.[0] || "";
        return (ap + n).toUpperCase() || "?";
    }

    function fullName(p: Profesor) {
        const ape = p.apellido_paterno || p.apellido_materno || "";
        return `${ape} ${p.nombres}`.trim() || "Sin nombre";
    }

    // ==================== CARGA DATOS ====================
    let lastHash = "";

    async function cargarProfesores(silent = false) {
        if (!isMounted) return;

        // Only trigger visual loading if we have no data and it's not a silent update
        if (!silent && profesores.length === 0) {
            isLoading = true;
        }

        try {
            // 1. Fetch main list first
            const data = await profesoresService.getProfesores(silent);

            if (!isMounted) return;

            // Update main list immediately
            const newHash = hash(data);
            if (newHash !== lastHash) {
                lastHash = newHash;
                // Preserve existing assignments if we already have them for these professors
                // This prevents flickering if we are refreshing
                profesores = data.map((newP) => {
                    const existing = profesores.find(
                        (oldP) => oldP.id_profesor === newP.id_profesor,
                    );
                    return existing
                        ? { ...newP, asignaciones: existing.asignaciones }
                        : newP;
                });
                hasChanges = true;
                setTimeout(() => (hasChanges = false), 1000);
            }

            // Success - stop loading spinner immediately so user sees the list
            isLoading = false;

            // 2. Progressively fetch assignments
            // We don't await this entire block, we let it run in background
            // But for 'refrescar' (Promise.all) we might want to wait?
            // The user requested progressive loading, implying they want to see the list ASAP.
            // But 'refrescar' awaits everything.
            // To be safe, we will await it but since isLoading is false, the UI is interactive.
            // Actually, for better UX, we process them concurrently but update reactively as they finish.

            const processAssignments = async () => {
                const limit = 5; // Concurrency limit
                const chunks = [];
                for (let i = 0; i < profesores.length; i += limit) {
                    chunks.push(profesores.slice(i, i + limit));
                }

                for (const chunk of chunks) {
                    if (!isMounted) return;
                    await Promise.all(
                        chunk.map(async (p) => {
                            try {
                                // Check cache is handled by service now!
                                const asignaciones =
                                    await profesoresService.getAsignaciones(
                                        p.id_profesor,
                                    );

                                if (!isMounted) return;

                                // Find current index (it might have changed if list reordered/filtered, though unlikely during load)
                                const idx = profesores.findIndex(
                                    (curr) =>
                                        curr.id_profesor === p.id_profesor,
                                );
                                if (idx !== -1) {
                                    // Only update if changed or missing
                                    if (
                                        JSON.stringify(
                                            profesores[idx].asignaciones,
                                        ) !== JSON.stringify(asignaciones)
                                    ) {
                                        profesores[idx] = {
                                            ...profesores[idx],
                                            asignaciones,
                                        };
                                        // Reactivity trigger - assigning to self or array index trigger
                                        // Svelte 3/4 legacy requires assignment
                                        // professors = professors; // Too many updates?
                                        // Optimizing: only trigger if visible?
                                        // Let's just assign.
                                    }
                                }
                            } catch (e) {
                                console.error(
                                    `Failed assignment load for ${p.id_profesor}`,
                                    e,
                                );
                            }
                        }),
                    );
                    // Trigger reactivity once per chunk to avoid too many renders
                    profesores = profesores;
                }
            };

            await processAssignments();
        } catch (err: any) {
            console.error("Error loading professors, retrying...", err);
            // Automatic retry after 2 seconds if still mounted
            if (isMounted) {
                setTimeout(() => cargarProfesores(silent), 2000);
            }
        }
    }

    async function cargarCargos() {
        try {
            cargos = await administrativosService.getCargos();
        } catch {}
    }

    async function refrescar(silent = false) {
        await Promise.all([cargarProfesores(silent), cargarCargos()]);
    }

    function pollingStart(interval = POLLING_INTERVAL) {
        pollingStop();
        polling = setInterval(() => refrescar(true), interval) as any;
    }

    function pollingStop() {
        if (polling) clearInterval(polling);
        polling = null;
    }

    function pollingRapido() {
        pollingStop();
        pollingStart(FAST_POLLING_INTERVAL);
        setTimeout(() => pollingStart(POLLING_INTERVAL), 10000);
    }

    onMount(() => {
        isMounted = true;
        refrescar();
        pollingStart();
        const vis = () => !document.hidden && refrescar(true);
        document.addEventListener("visibilitychange", vis);
        onDestroy(() => {
            isMounted = false;
            pollingStop();
            document.removeEventListener("visibilitychange", vis);
        });
    });

    // ==================== ACCIONES ====================
    function abrirNuevo() {
        mostrarNuevo = true;
        mostrarEditar = false;
        mostrarDetalles = false;
    }

    function abrirEditar(p: Profesor, e: Event) {
        e.stopPropagation(); // Prevent opening details
        profesorSeleccionado = p;
        mostrarEditar = true;
        mostrarNuevo = false;
        mostrarDetalles = false;
    }

    function abrirDetalles(p: Profesor) {
        profesorSeleccionado = p;
        mostrarDetalles = true;
        mostrarNuevo = false;
        mostrarEditar = false;
    }

    function cerrarForms() {
        mostrarNuevo = false;
        mostrarEditar = false;
        mostrarDetalles = false;
        profesorSeleccionado = null;
    }

    async function onSave(e: CustomEvent<Profesor>) {
        const saved = e.detail;
        const idx = profesores.findIndex(
            (p) => p.id_profesor === saved.id_profesor,
        );
        if (idx >= 0) profesores[idx] = saved;
        else profesores = [...profesores, saved];
        profesores = profesores;
        cerrarForms();
        await refrescar(true);
        pollingRapido();
    }

    function onDelete(e: CustomEvent<{ id: number }>) {
        // id returned matches id_profesor usually? Or maybe service return void.
        // We'll trust refrescar() to clean up, but optimistic update ok too
        profesores = profesores.filter((p) => p.id_profesor !== e.detail.id); // Assuming e.detail.id is id_profesor
        cerrarForms();
        refrescar(true);
    }

    // ==================== HELPER CARGO ====================
    function getCargoName(id?: number) {
        if (!id) return "";
        const c = cargos.find((x) => x.id_cargo === id);
        return c ? c.nombre_cargo : "";
    }

    function getUniqueSubjects(p: Profesor) {
        if (!p.asignaciones) return [];
        const subjects = p.asignaciones
            .map((a) => a.nombre_materia)
            .filter((n): n is string => !!n);
        return [...new Set(subjects)];
    }

    // ==================== IMPORTACIÓN CSV ====================

    let isImporting = false;

    function abrirImportar() {
        if (isImporting) return;
        fileInput.click();
    }

    async function handleImportSelect(e: Event) {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        // Reset input immediately so same file can be selected again if needed
        target.value = "";

        // Guardar archivo y mostrar modal de confirmación
        archivoAImportar = file;
        mostrarModalConfirmImport = true;
    }

    async function confirmarImportacion() {
        mostrarModalConfirmImport = false;
        if (archivoAImportar) {
            await procesarImportacion(archivoAImportar);
            archivoAImportar = null;
        }
    }

    function cancelarImportacion() {
        mostrarModalConfirmImport = false;
        archivoAImportar = null;
    }

    async function procesarImportacion(file: File) {
        isImporting = true;
        let createdCount = 0;
        let errors: string[] = [];

        try {
            // Pre-load data for assignments & cargos
            const [coursesRes, subjectsRes] = await Promise.all([
                coursesService.getCourses(),
                academicService.getReporteMateriasPorNivel(),
                // Ensure cargos loaded
                cargos.length === 0 ? cargarCargos() : Promise.resolve(),
            ]);

            // Normalize lists
            const allCourses: any[] = Array.isArray(coursesRes)
                ? coursesRes
                : coursesRes.data || [];
            const allSubjects: any[] = subjectsRes.materias || [];

            const text = await file.text();
            // Detect delimiter: check first line
            const firstLine = text.split(/\r?\n/)[0];
            const delimiter = firstLine.includes(";") ? ";" : ",";

            const lines = text
                .split(/\r?\n/)
                .filter((l) => l.trim().length > 0);
            if (lines.length < 2) {
                importErrorMessage =
                    "El archivo CSV parece estar vacío o no tiene formato válido.";
                mostrarModalImportError = true;
                return;
            }

            // Headers normalization
            const headers = lines[0].split(delimiter).map((h) =>
                h
                    .trim()
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "") // remove accents
                    .replace(/_/g, " "),
            );

            // Helper to find index by flexible name
            const getIdx = (keywords: string[]) =>
                headers.findIndex((h) => keywords.some((k) => h.includes(k)));

            // Map standard fields to indices
            const mapIdx = {
                ci: getIdx(["ci", "cedula", "carnet"]),
                nombres: getIdx(["nombres", "nombre"]),
                paterno: getIdx(["apellido paterno", "paterno"]),
                materno: getIdx(["apellido materno", "materno"]),
                correo: getIdx(["correo", "email"]),
                telefono: getIdx(["telefono", "celular"]),
                direccion: getIdx(["direccion", "domicilio"]),
                especialidad: getIdx(["especialidad"]),
                titulo: getIdx(["titulo"]),
                cargo: getIdx(["cargo"]),
                estado: getIdx(["estado"]),
                experiencia: getIdx(["experiencia"]),
                fecha: getIdx(["fecha ingreso", "ingreso"]),
                nivel: getIdx(["nivel"]),
                // Assignments
                materias: getIdx(["materias asignadas", "materias"]),
                cursos: getIdx(["cursos asignados", "cursos"]),
            };

            if (
                mapIdx.nombres === -1 ||
                mapIdx.paterno === -1 ||
                mapIdx.ci === -1
            ) {
                importErrorMessage =
                    "El CSV debe tener al menos columnas para CI, Nombres y Apellido Paterno.";
                mostrarModalImportError = true;
                return;
            }

            // Helper for Date parsing
            const parseDate = (d: string) => {
                if (!d) return new Date().toISOString().split("T")[0];
                d = d.trim();
                if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
                const parts = d.split("/");
                if (parts.length === 3) {
                    const day = parts[0].padStart(2, "0");
                    const month = parts[1].padStart(2, "0");
                    const year = parts[2];
                    return `${year}-${month}-${day}`;
                }
                return new Date().toISOString().split("T")[0]; // Fallback
            };

            // Iterate rows
            for (let i = 1; i < lines.length; i++) {
                const row = lines[i]
                    .split(delimiter)
                    .map((c) =>
                        c.trim().replace(/^"|"$/g, "").replace(/""/g, '"'),
                    );
                if (row.length < headers.length * 0.5) continue;

                const ci = row[mapIdx.ci];
                const email = mapIdx.correo !== -1 ? row[mapIdx.correo] : "";
                const nombreCompleto = row[mapIdx.nombres];

                // Local Duplicate Check
                const existsCi = profesores.some((p) => p.ci === ci);
                const existsEmail =
                    email && profesores.some((p) => p.correo === email);

                if (existsCi) {
                    errors.push(
                        `Fila ${i + 1}: El CI ${ci} ya existe (Profesor: ${nombreCompleto || "Desconocido"}).`,
                    );
                    continue;
                }
                if (existsEmail) {
                    errors.push(`Fila ${i + 1}: El correo ${email} ya existe.`);
                    continue;
                }

                // Prepare Object
                const newItem: any = {
                    ci: ci,
                    nombres: nombreCompleto,
                    apellido_paterno: row[mapIdx.paterno],
                    apellido_materno:
                        mapIdx.materno !== -1 ? row[mapIdx.materno] : undefined,
                    correo: email || undefined,
                    telefono:
                        mapIdx.telefono !== -1
                            ? row[mapIdx.telefono]
                            : undefined,
                    direccion:
                        mapIdx.direccion !== -1
                            ? row[mapIdx.direccion]
                            : undefined,
                    especialidad:
                        mapIdx.especialidad !== -1
                            ? row[mapIdx.especialidad]
                            : undefined,
                    titulo_academico:
                        mapIdx.titulo !== -1 ? row[mapIdx.titulo] : undefined,
                    estado_laboral:
                        mapIdx.estado !== -1
                            ? row[mapIdx.estado] || "activo"
                            : "activo",
                    anos_experiencia:
                        mapIdx.experiencia !== -1
                            ? parseInt(row[mapIdx.experiencia]) || 0
                            : 0,
                    fecha_ingreso:
                        mapIdx.fecha !== -1
                            ? parseDate(row[mapIdx.fecha])
                            : new Date().toISOString().split("T")[0],
                    nivel_enseñanza:
                        mapIdx.nivel !== -1 ? row[mapIdx.nivel] : "todos",
                };

                // Cargo mapping logic: Explicit NULL if missing/empty
                if (mapIdx.cargo !== -1) {
                    const cargoName = (row[mapIdx.cargo] || "")
                        .toLowerCase()
                        .trim();
                    if (cargoName) {
                        const foundCargo = cargos.find((c) =>
                            c.nombre_cargo.toLowerCase().includes(cargoName),
                        );
                        if (foundCargo) {
                            newItem.id_cargo = foundCargo.id_cargo;
                        } else {
                            newItem.id_cargo = undefined; // Not found -> null
                        }
                    } else {
                        newItem.id_cargo = undefined; // Empty -> null
                    }
                } else {
                    newItem.id_cargo = undefined; // Missing -> null
                }

                let createdProf: Profesor | null = null;
                try {
                    createdProf =
                        await profesoresService.createProfesor(newItem);
                    createdCount++;
                } catch (e: any) {
                    console.error("Row error", e);
                    const reason =
                        e?.response?.data?.detail ||
                        e.message ||
                        JSON.stringify(e);
                    errors.push(
                        `Fila ${i + 1}: Error al crear profesor ${nombreCompleto} (${reason}).`,
                    );
                    continue;
                }

                // 2. Assignments Logic
                if (
                    createdProf &&
                    mapIdx.materias !== -1 &&
                    mapIdx.cursos !== -1
                ) {
                    const rawSubjects = (row[mapIdx.materias] || "")
                        .split("|")
                        .map((s) => s.trim())
                        .filter(Boolean);
                    const rawCourses = (row[mapIdx.cursos] || "")
                        .split("|")
                        .map((c) => c.trim())
                        .filter(Boolean);

                    if (rawSubjects.length > 0 && rawCourses.length > 0) {
                        // Map names to IDs
                        const subjectIds = rawSubjects
                            .map((name) => {
                                const found = allSubjects.find(
                                    (s) =>
                                        s.nombre_materia.toLowerCase() ===
                                        name.toLowerCase(),
                                );
                                return found ? found.id_materia : null;
                            })
                            .filter(Boolean);

                        const courseIds = rawCourses
                            .map((name) => {
                                const found = allCourses.find(
                                    (c) =>
                                        c.nombre_curso.toLowerCase().trim() ===
                                        name.toLowerCase(),
                                );
                                return found ? found.id_curso : null;
                            })
                            .filter(Boolean);

                        // Cartesian Product
                        for (const sId of subjectIds) {
                            for (const cId of courseIds) {
                                try {
                                    await profesoresService.asignarCursoMateria(
                                        {
                                            id_profesor:
                                                createdProf.id_profesor,
                                            id_curso: cId,
                                            id_materia: sId,
                                        },
                                    );
                                } catch (assignErr) {
                                    console.warn(
                                        `Error asignando ${sId} en ${cId}`,
                                        assignErr,
                                    );
                                }
                            }
                        }
                    }
                }
            }

            // Summary
            let msg = `**Proceso completado**\n\nProfesores creados: ${createdCount}\nErrores: ${errors.length}`;
            if (errors.length > 0) {
                msg += `\n\n**Detalles de errores:**\n${errors.slice(0, 10).join("\n")}`;
                if (errors.length > 10)
                    msg += `\n... y ${errors.length - 10} más.`;
            }
            importResultMessage = msg;
            mostrarModalImportResult = true;

            // Refresh
            if (createdCount > 0) {
                pollingRapido();
                await cargarProfesores();
            }
        } catch (err) {
            console.error("Critical import error", err);
            importErrorMessage =
                "Ocurrió un error crítico al procesar el archivo.";
            mostrarModalImportError = true;
        } finally {
            isImporting = false;
        }
    }

    function getUniqueCourses(p: Profesor) {
        if (!p.asignaciones) return [];
        const courses = p.asignaciones
            .map((a) => a.nombre_curso)
            .filter((n): n is string => !!n);
        return [...new Set(courses)];
    }

    let isExporting = false;

    async function exportarCSV() {
        if (!filtrados.length || isExporting) return;
        isExporting = true;

        try {
            // Ensure all assignments are loaded for the filtered list before exporting
            const professorsToExport = await Promise.all(
                filtrados.map(async (p) => {
                    // Deep clone to avoid mutating original list references
                    let prof = JSON.parse(JSON.stringify(p));

                    // Validation: If name is missing or looks like a course (e.g. "Primaria", "Secundaria")
                    // we fetch fresh data. This handles potential data corruption for seeded users.
                    const lowerName = (prof.nombres || "").toLowerCase().trim();
                    const nameLooksInvalid =
                        !prof.nombres ||
                        lowerName.startsWith("primaria") ||
                        lowerName.startsWith("secundaria") ||
                        lowerName.startsWith("inicial");

                    if (nameLooksInvalid) {
                        try {
                            const freshData =
                                await profesoresService.getProfesor(
                                    prof.id_profesor,
                                );
                            prof = { ...prof, ...freshData };
                        } catch (e) {
                            console.error(
                                "Error refreshing professor data for export",
                                e,
                            );
                        }
                    }

                    // If assignments are missing, fetch them
                    if (!prof.asignaciones || prof.asignaciones.length === 0) {
                        try {
                            const asignaciones =
                                await profesoresService.getAsignaciones(
                                    prof.id_profesor,
                                );
                            prof.asignaciones = asignaciones;
                        } catch (e) {
                            console.error(
                                "Error fetching assignments for export",
                                e,
                            );
                            prof.asignaciones = [];
                        }
                    }
                    return prof;
                }),
            );

            const headers = [
                "ID",
                "CI",
                "Nombres",
                "Apellido Paterno",
                "Apellido Materno",
                "Correo",
                "Teléfono",
                "Especialidad",
                "Título Académico",
                "Nivel Enseñanza",
                "Cargo",
                "Estado Laboral",
                "Años Experiencia",
                "Fecha Ingreso",
                "Materias Asignadas",
                "Cursos Asignados",
            ];

            const rows = professorsToExport.map((p) => {
                const subjects = getUniqueSubjects(p).join(" | ");
                const courses = getUniqueCourses(p).join(" | ");
                const cargo = getCargoName(p.id_cargo);

                // Explicitly access fields to ensure order
                const data = [
                    p.id_profesor,
                    p.ci,
                    p.nombres,
                    p.apellido_paterno,
                    p.apellido_materno,
                    p.correo,
                    p.telefono,
                    p.especialidad,
                    p.titulo_academico,
                    p.nivel_enseñanza,
                    cargo,
                    p.estado_laboral,
                    p.anos_experiencia,
                    p.fecha_ingreso,
                    subjects,
                    courses,
                ];

                return data
                    .map((val) => `"${String(val || "").replace(/"/g, '""')}"`)
                    .join(";");
            });

            const csvContent = [headers.join(";"), ...rows].join("\n");
            const bom = "\uFEFF";
            const blob = new Blob([bom + csvContent], {
                type: "text/csv;charset=utf-8;",
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute(
                "download",
                `profesores_export_${new Date().toISOString().slice(0, 10)}.csv`,
            );
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } finally {
            isExporting = false;
        }
    }

    // ==================== FILTROS ====================
    $: materias = [
        ...new Set(profesores.flatMap((p) => getUniqueSubjects(p))),
    ].sort();

    $: filtrados = profesores.filter((p) => {
        const q = searchQuery.toLowerCase();
        const pSubjects = getUniqueSubjects(p);

        // Name/CI matches
        const okNombre =
            p.nombres?.toLowerCase().includes(q) ||
            p.apellido_paterno?.toLowerCase().includes(q) ||
            fullName(p).toLowerCase().includes(q);
        const okCI = p.ci?.toLowerCase().includes(q) ?? false;

        // Materia match (part of main search query)
        const okMateriaQuery = pSubjects.some((s) =>
            s.toLowerCase().includes(q),
        );

        const okEstadoSelect =
            estadoSeleccionado === "todos" ||
            p.estado_laboral?.toLowerCase() ===
                estadoSeleccionado.toLowerCase();

        const okMateriaSelect =
            materiaSeleccionada === "todas" ||
            pSubjects.includes(materiaSeleccionada);

        return (
            (okNombre || okCI || okMateriaQuery) &&
            okEstadoSelect &&
            okMateriaSelect
        );
    });
</script>

{#if mostrarNuevo}
    <CreateProfesor on:save={onSave} on:cancel={cerrarForms} />
{:else if mostrarEditar && profesorSeleccionado}
    <EditarProfesor
        profesor={profesorSeleccionado}
        on:save={onSave}
        on:cancel={cerrarForms}
        on:delete={onDelete}
    />
{:else if mostrarDetalles && profesorSeleccionado}
    <DetallesProfesor
        profesor={profesorSeleccionado}
        on:cancel={cerrarForms}
        on:edit={() => {
            mostrarDetalles = false;
            mostrarEditar = true;
        }}
    />
{:else}
    <div class="profesores-container panel">
        <!-- TÍTULO -->
        <div class="title-section">
            <div class="title-with-icon">
                <div class="title-icon">
                    {@html getIconSvg("users")}
                </div>
                <div>
                    <h1>Profesores</h1>
                    <p>Gestiona la información del personal docente</p>
                </div>
            </div>
        </div>

        <!-- BOTÓN A LA DERECHA (DEBAJO DEL TÍTULO) -->
        <div class="button-row">
            <!-- Hidden Input for Import -->
            <input
                type="file"
                id="importInput"
                accept=".csv"
                style="display: none;"
                bind:this={fileInput}
                on:change={handleImportSelect}
            />

            <button
                class="btn-outline-cyan"
                on:click={abrirImportar}
                disabled={isImporting}
            >
                {#if isImporting}
                    <span class="spinner-sm"></span> Importando...
                {:else}
                    Importar CSV
                {/if}
            </button>

            <button
                class="btn-outline-cyan"
                on:click={exportarCSV}
                disabled={isExporting}
            >
                {#if isExporting}
                    <span class="spinner-sm"></span> Exportando...
                {:else}
                    {@html getIconSvg("download")} Exportar CSV
                {/if}
            </button>
            <button class="btn-nuevo" on:click={abrirNuevo}
                >+ Nuevo Profesor</button
            >
        </div>

        <!-- FILTROS -->
        <div class="filters">
            <input
                type="text"
                placeholder="Buscar por nombre, CI, materia..."
                bind:value={searchQuery}
            />
            <div class="filter-group">
                <select bind:value={materiaSeleccionada}>
                    <option value="todas">Todas las materias</option>
                    {#each materias as m}
                        <option value={m}>{m}</option>
                    {/each}
                </select>
                <select bind:value={estadoSeleccionado}>
                    <option value="todos">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="retirado">Inactivo</option>
                    <option value="licencia">Licencia</option>
                    <option value="suspendido">Suspendido</option>
                </select>
            </div>
        </div>

        <!-- GRID DE PROFESORES -->
        <div class="grid-container">
            {#if isLoading && profesores.length === 0}
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Cargando profesores...</p>
                </div>
            {:else if filtrados.length === 0}
                <div class="empty-state">
                    <p>No se encontraron profesores.</p>
                </div>
            {:else}
                <div class="grid" class:updating={hasChanges}>
                    {#each filtrados as p (p.id_profesor ?? Math.random())}
                        <div
                            class="card"
                            role="button"
                            tabindex="0"
                            on:click={() => abrirDetalles(p)}
                            on:keydown={(e) =>
                                e.key === "Enter" && abrirDetalles(p)}
                        >
                            <div class="avatar-circle">{initials(p)}</div>

                            <div class="info">
                                <div class="name-line">
                                    <h3>{fullName(p)}</h3>
                                </div>

                                <div class="subjects-row">
                                    {#each getUniqueSubjects(p).slice(0, 3) as subject}
                                        <span class="cargo-pill">{subject}</span
                                        >
                                    {/each}
                                    {#if getUniqueSubjects(p).length > 3}
                                        <span class="more-pill"
                                            >+{getUniqueSubjects(p).length -
                                                3}</span
                                        >
                                    {/if}
                                    {#if getUniqueSubjects(p).length === 0}
                                        <span class="no-data-pill"
                                            >Sin materias</span
                                        >
                                    {/if}
                                </div>

                                <div class="area-row">
                                    {#each getUniqueCourses(p).slice(0, 3) as course}
                                        <span class="area-tag">{course}</span>
                                    {/each}
                                    {#if getUniqueCourses(p).length > 3}
                                        <span class="more-pill"
                                            >+{getUniqueCourses(p).length -
                                                3}</span
                                        >
                                    {/if}
                                    {#if getUniqueCourses(p).length === 0}
                                        <span class="no-data-text"
                                            >Sin cursos asignados</span
                                        >
                                    {/if}

                                    <span class="id-tag">CI: {p.ci}</span>
                                </div>

                                <div class="footer">
                                    <div class="actions-card">
                                        <button
                                            class="btn-icon-edit"
                                            on:click={(e) => abrirEditar(p, e)}
                                            title="Editar"
                                        >
                                            {@html getIconSvg("edit")}
                                        </button>
                                    </div>

                                    <span
                                        class="estado {p.estado_laboral?.toLowerCase()}"
                                    >
                                        {p.estado_laboral === "retirado"
                                            ? "Inactivo"
                                            : p.estado_laboral === "licencia"
                                              ? "Licencia"
                                              : p.estado_laboral || "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
{/if}

<!-- MODAL: Confirmar Importación -->
{#if mostrarModalConfirmImport && archivoAImportar}
    <div
        class="modal-backdrop"
        on:click={cancelarImportacion}
        role="button"
        tabindex="0"
        on:keydown={(e) => e.key === "Escape" && cancelarImportacion()}
    >
        <div
            class="modal-content modal-confirm"
            on:click|stopPropagation
            role="dialog"
            aria-labelledby="modal-confirm-title"
        >
            <div class="modal-header">
                <h3 id="modal-confirm-title">Confirmar Importación</h3>
                <button class="close-btn" on:click={cancelarImportacion}>
                    {@html getIconSvg("x")}
                </button>
            </div>
            <div class="modal-body">
                <div class="confirm-icon">
                    {@html getIconSvg("upload")}
                </div>
                <p class="confirm-text">
                    ¿Deseas importar el archivo <strong
                        >"{archivoAImportar.name}"</strong
                    >?
                </p>
                <p class="confirm-subtext">
                    Se intentarán crear nuevos profesores basándose en los datos
                    del archivo CSV.
                </p>
            </div>
            <div class="modal-actions">
                <button
                    class="btn-secondary"
                    on:click={cancelarImportacion}
                    disabled={isImporting}
                >
                    Cancelar
                </button>
                <button
                    class="btn-primary"
                    on:click={confirmarImportacion}
                    disabled={isImporting}
                >
                    {#if isImporting}
                        <span class="spinner-sm"></span> Importando...
                    {:else}
                        {@html getIconSvg("check")} Importar
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- MODAL: Resultado de Importación -->
{#if mostrarModalImportResult}
    <div
        class="modal-backdrop"
        on:click={() => (mostrarModalImportResult = false)}
        role="button"
        tabindex="0"
        on:keydown={(e) =>
            e.key === "Escape" && (mostrarModalImportResult = false)}
    >
        <div
            class="modal-content modal-result"
            on:click|stopPropagation
            role="dialog"
            aria-labelledby="modal-result-title"
        >
            <div class="modal-header">
                <h3 id="modal-result-title">Resultado de la Importación</h3>
                <button
                    class="close-btn"
                    on:click={() => (mostrarModalImportResult = false)}
                >
                    {@html getIconSvg("x")}
                </button>
            </div>
            <div class="modal-body">
                <div class="result-icon success">
                    {@html getIconSvg("check-circle")}
                </div>
                <div class="result-message">
                    {#each importResultMessage.split("\n") as line}
                        {#if line.startsWith("**")}
                            <p class="result-title">
                                {line.replace(/\*\*/g, "")}
                            </p>
                        {:else}
                            <p>{line}</p>
                        {/if}
                    {/each}
                </div>
            </div>
            <div class="modal-actions">
                <button
                    class="btn-primary"
                    on:click={() => (mostrarModalImportResult = false)}
                >
                    Cerrar
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- MODAL: Error de Importación -->
{#if mostrarModalImportError}
    <div
        class="modal-backdrop"
        on:click={() => (mostrarModalImportError = false)}
        role="button"
        tabindex="0"
        on:keydown={(e) =>
            e.key === "Escape" && (mostrarModalImportError = false)}
    >
        <div
            class="modal-content modal-error"
            on:click|stopPropagation
            role="dialog"
            aria-labelledby="modal-error-title"
        >
            <div class="modal-header">
                <h3 id="modal-error-title">Error en la Importación</h3>
                <button
                    class="close-btn"
                    on:click={() => (mostrarModalImportError = false)}
                >
                    {@html getIconSvg("x")}
                </button>
            </div>
            <div class="modal-body">
                <div class="result-icon error">
                    {@html getIconSvg("alert-circle")}
                </div>
                <p class="error-text">{importErrorMessage}</p>
            </div>
            <div class="modal-actions">
                <button
                    class="btn-secondary"
                    on:click={() => (mostrarModalImportError = false)}
                >
                    Cerrar
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    :root {
        --cyan: #00cfe6;
        --text: #1e293b;
        --muted: #64748b;
    }

    /* ==================== TÍTULO ==================== */
    .title-section {
        margin-bottom: 8px;
    }

    .title-section h1 {
        font-size: 1.8rem;
        color: var(--text);
        margin: 0 0 6px;
    }

    .title-section p {
        color: black;
        margin: 0;
    }

    /* ==================== BOTÓN A LA DERECHA ==================== */
    .button-row {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
    }

    .btn-nuevo {
        background: var(--cyan);
        color: white;
        border: none;
        padding: 10px 22px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        transition: 0.2s ease;
        box-shadow: 0 4px 10px rgba(0, 207, 230, 0.3);
    }

    .btn-nuevo:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 18px rgba(0, 207, 230, 0.4);
    }

    .btn-outline-cyan {
        background: white;
        color: var(--cyan);
        border: 1px solid var(--cyan);
        padding: 10px 22px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        transition: 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .btn-outline-cyan:hover {
        background: #f0fdff;
        transform: translateY(-2px);
    }

    .btn-outline-cyan :global(svg) {
        width: 18px;
        height: 18px;
    }

    /* ==================== FILTROS ==================== */
    .filters {
        display: flex;
        gap: 16px;
        margin-bottom: 28px;
        align-items: center;
        flex-wrap: nowrap; /* Enforce single line */
    }

    .filters input {
        flex: 1;
        min-width: 200px;
        padding: 12px 18px;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        background: white;
        font-size: 0.95rem;
        color: black;
    }

    .filters input:focus {
        outline: none;
        border-color: var(--cyan);
    }

    .filter-group {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-direction: row; /* FORCE ROW */
        flex-wrap: nowrap; /* Enforce single line */
        flex-shrink: 0; /* Prevent shrinking */
    }

    .filter-group select {
        padding: 12px 18px;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        background: white;
        font-size: 0.95rem;
        cursor: pointer;
        color: black;
        white-space: nowrap;
    }

    .filter-group select:focus {
        outline: none;
        border-color: var(--cyan);
    }

    /* ==================== GRID CONTAINER ==================== */
    .grid-container {
        min-height: 200px;
    }

    /* ==================== LOADING STATE ==================== */
    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        gap: 16px;
    }

    .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #e2e8f0;
        border-top: 4px solid var(--cyan);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .spinner-sm {
        width: 16px;
        height: 16px;
        border: 2px solid #e2e8f0;
        border-top: 2px solid var(--cyan);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        display: inline-block;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    .loading-state p {
        color: var(--muted);
        font-size: 0.95rem;
        margin: 0;
    }

    /* ==================== EMPTY STATE ==================== */
    .empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
    }

    .empty-state p {
        color: var(--muted);
        font-size: 1rem;
        margin: 0;
    }

    /* ==================== GRID ==================== */
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        transition: opacity 0.3s;
    }

    .grid.updating {
        opacity: 0.6;
    }

    /* ==================== CARD ==================== */
    .card {
        background: white;
        border-radius: 16px;
        padding: 16px;
        box-shadow: 0 3px 14px rgba(0, 0, 0, 0.06);
        border: 1px solid #f1f5f9;
        display: flex;
        gap: 16px;
        cursor: pointer;
        transition: 0.25s;
        position: relative;
    }

    .card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.12);
    }

    .avatar-circle {
        width: 52px;
        height: 52px;
        background: #9aa9ff;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1.2rem;
        flex-shrink: 0;
    }

    .info {
        flex: 1;
        min-width: 0;
    }

    .name-line {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
        flex-wrap: wrap;
    }

    .name-line h3 {
        margin: 0;
        font-size: 1rem;
        color: var(--text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .cargo-pill {
        background: linear-gradient(135deg, var(--cyan), #00a6b8);
        color: white;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 0.7rem;
        font-weight: 600;
    }

    .area-row {
        display: flex;
        gap: 6px;
        margin-bottom: 10px;
        flex-wrap: wrap;
    }

    .area-tag {
        background: #f1f5f9;
        padding: 3px 10px;
        border-radius: 6px;
        font-size: 0.8rem;
        color: black;
    }

    .id-tag {
        background: white;
        border: 1px solid #e2e8f0;
        padding: 3px 10px;
        border-radius: 6px;
        font-size: 0.8rem;
        color: #64748b;
    }

    .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 6px;
    }

    .actions-card {
        display: flex;
        gap: 4px;
    }

    .btn-icon-edit {
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f1f5f9;
        border: none;
        border-radius: 6px;
        width: 28px;
        height: 28px;
        cursor: pointer;
        color: #64748b;
        transition: 0.2s;
    }

    .btn-icon-edit:hover {
        background: #e2e8f0;
        color: var(--cyan);
    }

    .btn-icon-edit :global(svg) {
        width: 14px;
        height: 14px;
    }

    .estado {
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .estado.activo {
        background: #ecfdf5;
        color: #16a34a;
    }

    .estado.inactivo {
        background: #fffbeb;
        color: #d97706;
    }

    .estado.licencia {
        background: #eff6ff;
        color: #3b82f6;
    }

    .panel {
        background: #fff;
        border-radius: 14px;
        padding: 20px;
        box-shadow: 0 6px 18px rgba(25, 40, 60, 0.02);
        border: 1px solid #eef6fa;
    }
    .subjects-row {
        display: flex;
        gap: 6px;
        margin-bottom: 8px;
        flex-wrap: wrap;
    }

    .more-pill {
        background: #f1f5f9;
        color: var(--muted);
        padding: 2px 6px;
        border-radius: 6px;
        font-size: 0.7rem;
        font-weight: 600;
    }

    .no-data-pill {
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 0.7rem;
        font-weight: 500;
        background: #f8fafc;
        color: #94a3b8;
        border: 1px dashed #cbd5e1;
    }

    /* ==================== TITLE WITH ICON ==================== */
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

    .no-data-text {
        font-size: 0.8rem;
        opacity: 0.6;
        cursor: not-allowed;
    }

    /* ==================== MODAL STYLES ==================== */
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(15, 23, 42, 0.7);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 20px;
    }

    .modal-content {
        background: white;
        border-radius: 16px;
        width: 100%;
        max-width: 500px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
        animation: modalFadeIn 0.3s ease;
    }

    @keyframes modalFadeIn {
        from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }

    .modal-header {
        padding: 20px 24px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .modal-header h3 {
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
        transition: all 0.2s;
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
        text-align: center;
    }

    .confirm-icon,
    .result-icon {
        width: 64px;
        height: 64px;
        margin: 0 auto 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
    }

    .confirm-icon {
        background: linear-gradient(135deg, #00cfe6, #00a6b8);
        color: white;
    }

    .result-icon.success {
        background: #dcfce7;
        color: #15803d;
    }

    .result-icon.error {
        background: #fef2f2;
        color: #ef4444;
    }

    .confirm-icon :global(svg),
    .result-icon :global(svg) {
        width: 32px;
        height: 32px;
    }

    .confirm-text {
        font-size: 1.1rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 8px;
    }

    .confirm-subtext {
        font-size: 0.95rem;
        color: #64748b;
        margin: 0;
    }

    .error-text {
        font-size: 1rem;
        color: #1e293b;
        margin: 8px 0 0;
    }

    .result-message {
        margin-top: 16px;
        text-align: left;
    }

    .result-message p {
        margin: 6px 0;
        font-size: 0.95rem;
        color: #475569;
        line-height: 1.6;
    }

    .result-title {
        font-weight: 700;
        font-size: 1.05rem !important;
        color: #1e293b !important;
        margin: 12px 0 8px !important;
    }

    .modal-actions {
        padding: 20px 24px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: center;
        gap: 12px;
    }

    .modal-actions button {
        padding: 10px 24px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .modal-actions .btn-secondary {
        background: white;
        border: 1px solid #e2e8f0;
        color: #64748b;
    }

    .modal-actions .btn-secondary:hover {
        background: #f1f5f9;
        color: #1e293b;
    }

    .modal-actions .btn-primary {
        background: var(--cyan);
        border: none;
        color: white;
        box-shadow: 0 4px 10px rgba(0, 207, 230, 0.2);
    }

    .modal-actions .btn-primary:hover {
        background: #00b3c7;
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(0, 207, 230, 0.3);
    }

    .spinner-sm {
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
