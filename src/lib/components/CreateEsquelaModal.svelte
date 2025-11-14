<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { apiClient } from '$lib/services/api.js';
  import type { EsquelaCreate, CodigoEsquela, Estudiante, Profesor, Registrador } from '$lib/types/api.js';

  export let show = false;
  export let codigos: CodigoEsquela[] = [];

  const dispatch = createEventDispatcher();

  // Listas para los dropdowns
  let estudiantes: Estudiante[] = [];
  let profesores: Profesor[] = [];
  let registradores: Registrador[] = [];
  let cursos: any[] = [];

  // Campos del formulario
  let idEstudiante = 0;
  let idProfesor = 0;
  let idRegistrador = 0;
  let fecha = new Date().toISOString().split('T')[0];
  let observaciones = '';
  let codigosSeleccionados: number[] = [];

  // Estados de búsqueda
  let searchEstudiante = '';
  let searchProfesor = '';
  let searchRegistrador = '';
  let filtroCurso: number | null = null; // Filtro por curso
  let showEstudianteDropdown = false;
  let showProfesorDropdown = false;
  let showRegistradorDropdown = false;

  // Selecciones actuales
  let estudianteSeleccionado: Estudiante | null = null;
  let profesorSeleccionado: Profesor | null = null;
  let registradorSeleccionado: Registrador | null = null;

  let loading = false;
  let error = '';

  $: if (show) {
    cargarListas();
  }

  async function cargarListas() {
    try {
      const [estudiantesData, profesoresData, registradoresData, cursosData] = await Promise.all([
        apiClient.getEstudiantes(),
        apiClient.getProfesores(),
        apiClient.getRegistradores(),
        apiClient.getCourses()
      ]);
      
      estudiantes = estudiantesData;
      profesores = profesoresData;
      registradores = registradoresData;
      cursos = Array.isArray(cursosData) ? cursosData : [];
    } catch (err: any) {
      console.error('Error cargando listas:', err);
      error = err.message;
    }
  }

  async function cargarEstudiantesPorCurso(cursoId: number) {
    try {
      const estudiantesDelCurso = await apiClient.get(`/courses/${cursoId}/students`);
      estudiantes = Array.isArray(estudiantesDelCurso) ? estudiantesDelCurso : [];
    } catch (err: any) {
      console.error('Error cargando estudiantes del curso:', err);
    }
  }

  async function handleCursoChange() {
    if (filtroCurso) {
      await cargarEstudiantesPorCurso(filtroCurso);
    } else {
      // Recargar todos los estudiantes
      const estudiantesData = await apiClient.getEstudiantes();
      estudiantes = estudiantesData;
    }
    // Limpiar selección de estudiante al cambiar curso
    deseleccionarEstudiante();
  }

  function filtrarEstudiantes() {
    if (!searchEstudiante) return estudiantes.slice(0, 10);
    return estudiantes.filter(est => 
      est.nombre_completo.toLowerCase().includes(searchEstudiante.toLowerCase()) ||
      est.ci.includes(searchEstudiante)
    ).slice(0, 10);
  }

  function filtrarProfesores() {
    if (!searchProfesor) return profesores.slice(0, 10);
    return profesores.filter(prof => 
      prof.nombre_completo.toLowerCase().includes(searchProfesor.toLowerCase()) ||
      prof.ci.includes(searchProfesor)
    ).slice(0, 10);
  }

  function filtrarRegistradores() {
    if (!searchRegistrador) return registradores.slice(0, 10);
    return registradores.filter(reg => 
      reg.nombre_completo.toLowerCase().includes(searchRegistrador.toLowerCase()) ||
      reg.ci.includes(searchRegistrador)
    ).slice(0, 10);
  }

  function seleccionarEstudiante(estudiante: Estudiante) {
    estudianteSeleccionado = estudiante;
    idEstudiante = estudiante.id_estudiante;
    searchEstudiante = estudiante.nombre_completo;
    showEstudianteDropdown = false;
  }

  function deseleccionarEstudiante() {
    estudianteSeleccionado = null;
    idEstudiante = 0;
    searchEstudiante = '';
  }

  function seleccionarProfesor(profesor: Profesor) {
    profesorSeleccionado = profesor;
    idProfesor = profesor.id_persona;
    searchProfesor = profesor.nombre_completo;
    showProfesorDropdown = false;
  }

  function deseleccionarProfesor() {
    profesorSeleccionado = null;
    idProfesor = 0;
    searchProfesor = '';
  }

  function seleccionarRegistrador(registrador: Registrador) {
    registradorSeleccionado = registrador;
    idRegistrador = registrador.id_persona;
    searchRegistrador = registrador.nombre_completo;
    showRegistradorDropdown = false;
  }

  function deseleccionarRegistrador() {
    registradorSeleccionado = null;
    idRegistrador = 0;
    searchRegistrador = '';
  }

  function toggleCodigo(codigoId: number) {
    if (codigosSeleccionados.includes(codigoId)) {
      codigosSeleccionados = codigosSeleccionados.filter(id => id !== codigoId);
    } else {
      codigosSeleccionados = [...codigosSeleccionados, codigoId];
    }
  }

  async function crearEsquela() {
    if (!idEstudiante || !idProfesor || !observaciones || codigosSeleccionados.length === 0) {
      error = 'Todos los campos son obligatorios';
      return;
    }

    try {
      loading = true;
      error = '';

      await apiClient.createEsquela({
        id_estudiante: idEstudiante,
        id_profesor: idProfesor,
        id_registrador: idRegistrador,
        fecha: fecha + 'T00:00:00.000Z',
        observaciones,
        codigos: codigosSeleccionados
      });

      dispatch('created');
      cerrarModal();
    } catch (err: any) {
      error = err.message || 'Error creando esquela';
    } finally {
      loading = false;
    }
  }

  function cerrarModal() {
    show = false;
    // Reset form
    idEstudiante = 0;
    idProfesor = 0;
    fecha = new Date().toISOString().split('T')[0];
    observaciones = '';
    codigosSeleccionados = [];
    searchEstudiante = '';
    searchProfesor = '';
    searchRegistrador = '';
    filtroCurso = null;
    estudianteSeleccionado = null;
    profesorSeleccionado = null;
    registradorSeleccionado = null;
    error = '';
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      cerrarModal();
    }
  }

  // Cerrar dropdowns al hacer clic fuera
  function handleClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-container')) {
      showEstudianteDropdown = false;
      showProfesorDropdown = false;
      showRegistradorDropdown = false;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} on:click={handleClickOutside} />

{#if show}
  <div class="modal-overlay" on:click={cerrarModal} on:keydown={handleKeydown} role="dialog" aria-modal="true" tabindex="-1">
    <div class="modal" on:click|stopPropagation on:keydown={handleKeydown} role="document" tabindex="-1">
      <div class="modal-header">
        <h2>Nueva Esquela</h2>
        <button class="btn-close" on:click={cerrarModal}>&times;</button>
      </div>

      <div class="modal-content">
        {#if error}
          <div class="alert alert-error">
            ❌ {error}
          </div>
        {/if}

        <form on:submit|preventDefault={crearEsquela}>
          <!-- Filtro por Curso -->
          <div class="form-group">
            <label for="filtroCurso">Filtrar Estudiantes por Curso</label>
            <select 
              id="filtroCurso"
              bind:value={filtroCurso}
              on:change={handleCursoChange}
              class="curso-select"
            >
              <option value={null}>-- Todos los cursos --</option>
              {#each cursos as curso}
                <option value={curso.id_curso}>
                  {curso.nombre_curso || `${curso.grado}${curso.paralelo}`}
                </option>
              {/each}
            </select>
          </div>

          <!-- Estudiante -->
          <div class="form-group">
            <label>Estudiante *</label>
            <div class="dropdown-container">
              <div class="input-with-clear">
                <input
                  type="text"
                  placeholder="Buscar estudiante por nombre o cédula..."
                  bind:value={searchEstudiante}
                  on:focus={() => showEstudianteDropdown = true}
                  on:input={() => showEstudianteDropdown = true}
                  class="search-input"
                  class:selected={estudianteSeleccionado}
                />
                {#if estudianteSeleccionado}
                  <button 
                    type="button" 
                    class="clear-btn" 
                    on:click={deseleccionarEstudiante}
                    title="Limpiar selección"
                  >
                    ✕
                  </button>
                {/if}
              </div>
              {#if showEstudianteDropdown && filtrarEstudiantes().length > 0}
                <div class="dropdown">
                  {#each filtrarEstudiantes() as estudiante}
                    <div class="dropdown-item" on:click={() => seleccionarEstudiante(estudiante)}>
                      <div class="item-main">
                        <strong>{estudiante.nombre_completo}</strong>
                        <span class="item-detail">CI: {estudiante.ci}</span>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <!-- Profesor -->
          <div class="form-group">
            <label>Profesor *</label>
            <div class="dropdown-container">
              <div class="input-with-clear">
                <input
                  type="text"
                  placeholder="Buscar profesor por nombre o cédula..."
                  bind:value={searchProfesor}
                  on:focus={() => showProfesorDropdown = true}
                  on:input={() => showProfesorDropdown = true}
                  class="search-input"
                  class:selected={profesorSeleccionado}
                />
                {#if profesorSeleccionado}
                  <button 
                    type="button" 
                    class="clear-btn" 
                    on:click={deseleccionarProfesor}
                    title="Limpiar selección"
                  >
                    ✕
                  </button>
                {/if}
              </div>
              {#if showProfesorDropdown && filtrarProfesores().length > 0}
                <div class="dropdown">
                  {#each filtrarProfesores() as profesor}
                    <div class="dropdown-item" on:click={() => seleccionarProfesor(profesor)}>
                      <div class="item-main">
                        <strong>{profesor.nombre_completo}</strong>
                        <span class="item-detail">CI: {profesor.ci} | Tel: {profesor.telefono}</span>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <!-- Registrador -->
          <div class="form-group">
            <label>Registrador *</label>
            <div class="dropdown-container">
              <div class="input-with-clear">
                <input
                  type="text"
                  placeholder="Buscar registrador por nombre o cédula..."
                  bind:value={searchRegistrador}
                  on:focus={() => showRegistradorDropdown = true}
                  on:input={() => showRegistradorDropdown = true}
                  class="search-input"
                  class:selected={registradorSeleccionado}
                />
                {#if registradorSeleccionado}
                  <button 
                    type="button" 
                    class="clear-btn" 
                    on:click={deseleccionarRegistrador}
                    title="Limpiar selección"
                  >
                    ✕
                  </button>
                {/if}
              </div>
              {#if showRegistradorDropdown && filtrarRegistradores().length > 0}
                <div class="dropdown">
                  {#each filtrarRegistradores() as registrador}
                    <div class="dropdown-item" on:click={() => seleccionarRegistrador(registrador)}>
                      <div class="item-main">
                        <strong>{registrador.nombre_completo}</strong>
                        <span class="item-detail">CI: {registrador.ci} | Tel: {registrador.telefono}</span>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <div class="form-group">
            <label for="fecha">Fecha *</label>
            <input 
              type="date" 
              id="fecha"
              bind:value={fecha} 
              required
            />
          </div>

          <div class="form-group">
            <label for="observaciones">Observaciones *</label>
            <textarea 
              id="observaciones"
              bind:value={observaciones} 
              required
              rows="4"
              placeholder="Descripción del reconocimiento o esquela..."
            ></textarea>
          </div>

          <div class="form-group">
            <span class="form-label">Códigos de Esquela *</span>
            <div class="codigos-grid">
              {#each codigos as codigo}
                <label class="codigo-checkbox">
                  <input 
                    type="checkbox" 
                    checked={codigosSeleccionados.includes(codigo.id_codigo)}
                    on:change={() => toggleCodigo(codigo.id_codigo)}
                  />
                  <div class="codigo-info">
                    <span class="codigo-codigo">{codigo.codigo}</span>
                    <span class="codigo-descripcion">{codigo.descripcion}</span>
                    <span class="codigo-tipo">{codigo.tipo}</span>
                  </div>
                </label>
              {/each}
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" on:click={cerrarModal}>
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Esquela'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .modal-header h2 {
    margin: 0;
    color: #1e293b;
  }

  .btn-close {
    background: none;
    border: none;
    font-size: 2rem;
    color: #64748b;
    cursor: pointer;
    line-height: 1;
  }

  .btn-close:hover {
    color: #dc2626;
  }

  .modal-content {
    padding: 1.5rem;
  }

  .alert {
    padding: 0.75rem 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
  }

  .alert-error {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fca5a5;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label,
  .form-label {
    display: block;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.95rem;
    transition: border-color 0.2s;
  }

  .form-group input:focus,
  .form-group textarea:focus,
  .form-group select:focus {
    outline: none;
    border-color: #22d3ee;
  }

  .curso-select {
    background-color: #f8fafc;
    cursor: pointer;
  }

  .curso-select:hover {
    background-color: #f1f5f9;
  }

  .codigos-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 1rem;
  }

  .codigo-checkbox {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    transition: background-color 0.2s;
  }

  .codigo-checkbox:hover {
    background: #f8fafc;
  }

  .codigo-checkbox input[type="checkbox"] {
    margin-top: 0.25rem;
    width: auto;
  }

  .codigo-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }

  .codigo-codigo {
    font-weight: 600;
    color: #1e293b;
  }

  .codigo-descripcion {
    font-size: 0.9rem;
    color: #475569;
  }

  .codigo-tipo {
    font-size: 0.8rem;
    color: #64748b;
    text-transform: uppercase;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary {
    background: #f1f5f9;
    color: #475569;
  }

  .btn-secondary:hover {
    background: #e2e8f0;
  }

  .btn-primary {
    background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(34, 211, 238, 0.4);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Dropdown Styles */
  .dropdown-container {
    position: relative;
  }

  .input-with-clear {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem;
    padding-right: 2.5rem; /* Espacio para el botón de limpiar */
    border: 2px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.95rem;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: #22d3ee;
  }

  .search-input.selected {
    background-color: #f0f9ff;
    border-color: #0ea5e9;
  }

  .clear-btn {
    position: absolute;
    right: 0.75rem;
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
  }

  .clear-btn:hover {
    background: #f1f5f9;
    color: #dc2626;
    transform: scale(1.1);
  }

  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    max-height: 250px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    margin-top: 2px;
  }

  .dropdown-item {
    padding: 0.875rem;
    cursor: pointer;
    border-bottom: 1px solid #f1f5f9;
    transition: background-color 0.2s;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .dropdown-item:hover {
    background: #f8fafc;
  }

  .dropdown-item:last-child {
    border-bottom: none;
  }

  .item-main {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .item-main strong {
    color: #1e293b;
    font-size: 0.95rem;
  }

  .item-detail {
    color: #64748b;
    font-size: 0.85rem;
  }

  .item-cedula {
    color: #64748b;
    font-size: 0.85rem;
    font-family: monospace;
    background: #f1f5f9;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
</style>