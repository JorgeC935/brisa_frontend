<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { apiClient } from '$lib/services/api.js';
  import { authService } from '$lib/services/auth.js';
  import type { EsquelaCreate, CodigoEsquela, Estudiante, Profesor } from '$lib/types/api.js';
  import './CreateEsquelaModal.css';
  
  const dispatch = createEventDispatcher();
  
  export let show = false;
  export let codigos: CodigoEsquela[] = [];


  // Obtener usuario actual
  let currentUser = authService.getUserData();
  let userRole = currentUser?.roles?.[0]?.nombre || '';
  let isProfesor = userRole === 'Profesor';
  let isAdmin = userRole === 'Administrativo';
  let isRegente = userRole === 'Regente';

  // Listas para los dropdowns
  let estudiantes: Estudiante[] = [];
  let profesores: Profesor[] = [];
  let cursos: any[] = [];

  // Campos del formulario
  let idEstudiante = 0;
  let idProfesor = 0;
  let fecha = new Date().toISOString().split('T')[0];
  let observaciones = '';
  let codigosSeleccionados: number[] = [];

  // Estados de búsqueda
  let searchEstudiante = '';
  let searchProfesor = '';
  let filtroCurso: number | null = null; // Curso seleccionado
  let showEstudianteDropdown = false;
  let showProfesorDropdown = false;

  // Selecciones actuales
  let estudianteSeleccionado: Estudiante | null = null;
  let profesorSeleccionado: Profesor | null = null;

  // Mostrar/ocultar campo profesor según rol
  let mostrarCampoProfesor = !isProfesor;

  let loading = false;
  let error = '';

  // Variables reactivas para los dropdowns filtrados
  $: estudiantesFiltrados = searchEstudiante 
    ? estudiantes.filter(est => {
        const nombreCompleto = est.nombre_completo || '';
        const ci = est.ci || '';
        return nombreCompleto.toLowerCase().includes(searchEstudiante.toLowerCase()) ||
               ci.includes(searchEstudiante);
      }).slice(0, 10)
    : estudiantes.slice(0, 10);

  $: profesoresFiltrados = searchProfesor
    ? profesores.filter(prof => 
        prof.nombre_completo.toLowerCase().includes(searchProfesor.toLowerCase()) ||
        prof.ci.includes(searchProfesor)
      ).slice(0, 10)
    : profesores.slice(0, 10);

  $: if (show) {
    cargarListas();
  }

  async function cargarListas() {
    try {
      // Cargar cursos según el rol:
      // - Profesor/Regente: solo sus cursos asignados usando /courses/mis_cursos/{id_usuario}
      // - Administrativo: todos los cursos usando /courses/
      let cursosData;
      
      if (isProfesor || isRegente) {
        // Obtener id_usuario del usuario actual (asignador)
        const idUsuario = currentUser?.id_usuario;
        
        if (!idUsuario) {
          error = 'No se pudo obtener la información del usuario. Por favor, cierre sesión y vuelva a iniciar.';
          console.error('❌ id_usuario no disponible:', currentUser);
          return;
        }
        
        cursosData = await apiClient.getCourseTeachersList(idUsuario);
      } else {
        // Administrativo: todos los cursos
        cursosData = await apiClient.getCourses();
      }
      
      cursos = Array.isArray(cursosData) ? cursosData : [];

      // Para Regente y Administrativo, cargar lista de profesores
      if (!isProfesor) {
        const profesoresData = await apiClient.getProfesores();
        profesores = profesoresData;
      }
    } catch (err: any) {
      console.error('Error cargando listas:', err);
      error = err.message;
    }
  }

  async function cargarEstudiantesPorCurso(cursoId: number) {
    try {
      const response = await apiClient.get(`/courses/${cursoId}/students?page=1&page_size=1000`);
      console.log('Response completo:', response);
      
      // Extraer estudiantes según el formato de respuesta
      let estudiantesData = [];
      
      if (Array.isArray(response)) {
        estudiantesData = response;
      } else if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          estudiantesData = response.data;
        } else if ('items' in response && Array.isArray(response.items)) {
          estudiantesData = response.items;
        } else if ('estudiantes' in response && Array.isArray(response.estudiantes)) {
          estudiantesData = response.estudiantes;
        }
      }
      
      console.log('📊 estudiantesData extraído:', estudiantesData);
      
      // Construir nombre_completo si no existe
      estudiantes = estudiantesData.map((est: any) => {
        if (!est.nombre_completo && est.nombres) {
          est.nombre_completo = `${est.nombres} ${est.apellido_paterno || ''} ${est.apellido_materno || ''}`.trim();
        }
        return est;
      });
      
      console.log('✅ Array estudiantes final:', estudiantes.length, estudiantes);
      
      // Forzar actualización del estado reactivo
      estudiantes = [...estudiantes];
      
      // Abrir dropdown automáticamente si hay estudiantes
      if (estudiantes.length > 0) {
        showEstudianteDropdown = true;
      }
      
      // Limpiar error siempre al cargar estudiantes exitosamente
      error = '';
    } catch (err: any) {
      console.error('❌ Error cargando estudiantes:', err);
      error = `Error al cargar estudiantes: ${err.message}`;
      estudiantes = [];
    }
  }

  async function handleCursoChange() {
    // Limpiar selección de estudiante al cambiar curso
    deseleccionarEstudiante();
    
    if (filtroCurso) {
      await cargarEstudiantesPorCurso(filtroCurso);
    } else {
      // Recargar todos los estudiantes
      try {
        const estudiantesData = await apiClient.getEstudiantes();
        // Construir nombre_completo si no existe
        estudiantes = estudiantesData.map((est: any) => {
          if (!est.nombre_completo && est.nombres) {
            est.nombre_completo = `${est.nombres} ${est.apellido_paterno || ''} ${est.apellido_materno || ''}`.trim();
          }
          return est;
        });
        error = '';
      } catch (err: any) {
        console.error('Error cargando todos los estudiantes:', err);
        estudiantes = [];
      }
    }
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
    searchProfesor = `${profesor.nombres} ${profesor.apellido_paterno || ''} ${profesor.apellido_materno || ''}`.trim();
    showProfesorDropdown = false;
  }

  function deseleccionarProfesor() {
    profesorSeleccionado = null;
    idProfesor = 0;
    searchProfesor = '';
  }

  function toggleCodigo(codigoId: number) {
    if (codigosSeleccionados.includes(codigoId)) {
      codigosSeleccionados = codigosSeleccionados.filter(id => id !== codigoId);
    } else {
      codigosSeleccionados = [...codigosSeleccionados, codigoId];
    }
  }

  async function crearEsquela() {
    // Validar campos según el rol
    if (isProfesor) {
      // Profesor no necesita seleccionar profesor (backend lo asigna automáticamente)
      if (!idEstudiante || !observaciones || codigosSeleccionados.length === 0) {
        error = 'Todos los campos son obligatorios';
        return;
      }
    } else {
      // Regente/Administrativo necesitan seleccionar profesor
      if (!idEstudiante || !idProfesor || !observaciones || codigosSeleccionados.length === 0) {
        error = 'Todos los campos son obligatorios';
        return;
      }
    }

    try {
      loading = true;
      error = '';

      const payload: any = {
        id_estudiante: idEstudiante,
        fecha: fecha,  // Enviar solo la fecha en formato YYYY-MM-DD
        observaciones,
        codigos: codigosSeleccionados
      };

      // Solo incluir id_profesor si no es Profesor (Regente/Administrativo)
      if (!isProfesor && idProfesor) {
        payload.id_profesor = idProfesor;
      }

      console.log('📤 Payload para crear esquela:', payload);

      await apiClient.createEsquela(payload);

      dispatch('created');
      cerrarModal();
    } catch (err: any) {
      console.error('❌ Error creando esquela:', err);
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
    filtroCurso = null;
    estudianteSeleccionado = null;
    profesorSeleccionado = null;
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
              {#if showEstudianteDropdown}
                {#if estudiantesFiltrados.length > 0}
                  <div class="dropdown">
                    {#each estudiantesFiltrados as estudiante}
                      <div class="dropdown-item" on:click={() => seleccionarEstudiante(estudiante)}>
                        <div class="item-main">
                          <strong>{estudiante.nombre_completo}</strong>
                          <span class="item-detail">CI: {estudiante.ci}</span>
                        </div>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <div class="dropdown">
                    <div class="dropdown-item" style="color: #666; cursor: default;">
                      {#if filtroCurso}
                        No hay estudiantes en este curso
                      {:else}
                        No se encontraron estudiantes
                      {/if}
                    </div>
                  </div>
                {/if}
              {/if}
            </div>
          </div>

          <!-- Profesor que manda la esquela - Solo visible para Regente/Administrativo -->
        {#if mostrarCampoProfesor}
          <div class="form-group">
            <label>Profesor que manda la esquela *</label>
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
              {#if showProfesorDropdown && profesoresFiltrados.length > 0}
                <div class="dropdown">
                  {#each profesoresFiltrados as profesor}
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
        {/if}

          <!-- Fecha -->
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


