<script lang="ts">
  import './esquela.css';
  import { onMount } from 'svelte';
  import { apiClient } from '$lib/services/api.js';
  import { authService } from '$lib/services/auth.js';
  import type { EsquelaResponse, CodigoEsquela } from '$lib/types/api.js';
  import CreateEsquelaModal from '$lib/components/CreateEsquelaModal/CreateEsquelaModal.svelte';
  import { getIconSvg } from '$lib/components/svg';
  let searchQuery = '';
  let esquelas: EsquelaResponse[] = [];
  let codigos: CodigoEsquela[] = [];
  let loading = true;
  let error = '';
  let showCreateModal = false;

  // Nuevos filtros
  let courses: any[] = [];
  let selectedCourse: number | null = null;
  let nameFilter = ''; // Filtro por nombre de estudiante
  let typeFilter: string | null = null; // 'reconocimiento' | 'orientacion'
  let dateFrom: string | null = null;
  let dateTo: string | null = null;
  let selectedYear: number | null = null;
  let selectedMonth: number | null = null;

  // Estadísticas
  let aggregatedByCourse: any[] = [];
  let rankingData: any[] = [];
  let showStats = false;
  let showRanking = false;
  let selectedStudentId: number | null = null;
  let studentStats: any = null;

  // Mapeo de estudiante a curso
  let studentToCourseMap: Map<number, any> = new Map();

  // Mapeo de códigos a SVG icons (sin emojis)
  const tipoIconos: Record<string, string> = {
    'reconocimiento': 'trophy',
    'orientacion': 'clipboard-list',
    'academico': 'book-open',
    'deportivo': 'medal',
    'comportamiento': 'heart',
    'participacion': 'star'
  };


  let categoriaSeleccionada: string | null = null;

  onMount(async () => {
    await loadCourses();
    await loadStudentCourseMapping();
    await cargarDatos();
  });

  async function loadCourses() {
    
    try {
      const data = await apiClient.getCourses();
      courses = Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error loading courses:', err);
      courses = [];
    }
  }

  async function loadStudentCourseMapping() {
    try {
      // Cargar todos los cursos y sus estudiantes
      for (const course of courses) {
        const students = await apiClient.get(`/courses/${course.id_curso}/students`);
        if (Array.isArray(students)) {
          students.forEach((student: any) => {
            studentToCourseMap.set(student.id_estudiante, {
              id_curso: course.id_curso,
              nombre_curso: course.nombre_curso,
              grado: course.grado,
              paralelo: course.paralelo
            });
          });
        }
      }
      studentToCourseMap = studentToCourseMap; // Trigger reactivity
    } catch (err) {
      console.error('Error loading student-course mapping:', err);
    }
  }

  async function cargarDatos() {
    try {
      loading = true;
      const params: any = {};
      if (nameFilter) params.name = nameFilter;
      if (selectedCourse) params.course = selectedCourse;
      if (typeFilter) params.type = typeFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      if (selectedYear) params.year = selectedYear;
      if (selectedMonth) params.month = selectedMonth;

      const [esquelasData, codigosData] = await Promise.all([
        apiClient.getEsquelas(params),
        apiClient.getCodigosEsquelas()
      ]);
      // Handle paginated response structure
      if (esquelasData && esquelasData.data) {
        esquelas = Array.isArray(esquelasData.data) ? esquelasData.data : [];
      } else if (Array.isArray(esquelasData)) {
        esquelas = esquelasData;
      } else {
        esquelas = [];
      }
      console.log('Esquelas data sample:', esquelas[0]); // Debug: ver estructura completa
      codigos = Array.isArray(codigosData) ? codigosData : [];
      error = '';
    } catch (err: any) {
      console.error('Error cargando datos:', err);
      error = err.message || 'Error cargando datos';
      esquelas = [];
      codigos = [];
    } finally {
      loading = false;
    }
  }

  async function loadAggregateByCourse() {
    try {
      const res = await apiClient.getEsquelasAggregateByCourse(selectedYear ?? undefined);
      aggregatedByCourse = Array.isArray(res) ? res : [];
      showStats = true;
    } catch (err) {
      console.error('Error loading aggregate:', err);
      aggregatedByCourse = [];
    }
  }

  async function loadRanking(metric: 'student' | 'course' = 'student') {
    try {
      const params: any = { metric, limit: 10 };
      if (typeFilter) params.type = typeFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      // Get user data directly from localStorage
      let currentUser = authService.getUserData();

      // If id_persona is missing, refresh user data from API
      if (!currentUser?.id_persona) {
        console.log('⚠️ id_persona no encontrado en localStorage, llamando a /auth/me...');
        try {
          currentUser = await authService.getCurrentUser();
        } catch (e) {
          console.error("❌ Error al actualizar datos de usuario:", e);
        }
      }

      console.log('🔍 Usuario actual para ranking:', currentUser);
      console.log('🔍 id_persona:', currentUser?.id_persona);

      const isAdmin = currentUser?.roles?.some((role: any) => 
        role?.nombre === 'Administrativo' || role?.nombre === 'Administrador'
      );

      console.log('🔍 Es admin?:', isAdmin);

      if (!isAdmin && currentUser?.id_persona) {
        params.registrador_id = currentUser.id_persona;
        console.log('✅ Agregando registrador_id:', params.registrador_id);
      } else {
        console.log('ℹ️ No se agrega registrador_id (es admin o no hay id_persona)');
      }

      console.log('📤 Parámetros finales para ranking:', params);

      const res = await apiClient.getReportsRanking(params);
      rankingData = res && res.data ? res.data : (Array.isArray(res) ? res : []);
      showRanking = true;
    } catch (err) {
      console.error('Error loading ranking:', err);
      rankingData = [];
    }
  }

  async function loadStudentStats(studentId: number) {
    try {
      const params: any = {};
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      studentStats = await apiClient.getStudentEsquelas(studentId, params);
      selectedStudentId = studentId;
    } catch (err) {
      console.error('Error loading student stats:', err);
      studentStats = null;
    }
  }

  function resetFilters() {
    nameFilter = '';
    selectedCourse = null;
    typeFilter = null;
    dateFrom = null;
    dateTo = null;
    selectedYear = null;
    selectedMonth = null;
    categoriaSeleccionada = null;
    cargarDatos();
  }

  function obtenerCategorias() {
    const categoriaCount: Record<string, number> = {};
    
    if (!Array.isArray(esquelas)) {
      return [];
    }

    esquelas.forEach(esquela => {
      if (esquela.codigos && Array.isArray(esquela.codigos)) {
        esquela.codigos.forEach(codigo => {
          const tipo = codigo.tipo;
          categoriaCount[tipo] = (categoriaCount[tipo] || 0) + 1;
        });
      }
    });

    return Object.entries(categoriaCount).map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
      icono: tipoIconos[nombre] || 'file'
    }));
  }

  function filtrarEsquelas() {
    if (!Array.isArray(esquelas)) {
      return [];
    }

    let filtradas = esquelas;
    
    if (categoriaSeleccionada) {
      filtradas = filtradas.filter(esquela => 
        esquela.codigos && Array.isArray(esquela.codigos) && esquela.codigos.some(codigo => codigo.tipo === categoriaSeleccionada)
      );
    }
    
    if (searchQuery) {
      filtradas = filtradas.filter(esquela => 
        (esquela.observaciones && esquela.observaciones.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (esquela.codigos && Array.isArray(esquela.codigos) && esquela.codigos.some(codigo => 
          codigo.descripcion && codigo.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );
    }
    
    return filtradas;
  }

  function seleccionarCategoria(categoria: string) {
    categoriaSeleccionada = categoriaSeleccionada === categoria ? null : categoria;
  }

  function formatearFecha(fecha: string) {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function obtenerPrimerCodigo(esquela: EsquelaResponse) {
    return esquela.codigos[0] || { tipo: 'general', descripcion: 'Sin código', codigo: '' };
  }

  async function eliminarEsquela(id: number) {
    if (confirm('¿Está seguro de que desea eliminar esta esquela?')) {
      try {
        await apiClient.deleteEsquela(id);
        await cargarDatos(); // Recargar datos
      } catch (err: any) {
        alert('Error eliminando esquela: ' + err.message);
      }
    }
  }
</script>

<div class="esquelas-container">
  <!-- Header -->
  <div class="header">
    <div>
      <h1 class="titulo">Esquelas y Reconocimientos</h1>
      <p class="subtitulo">Registra reconocimientos y felicitaciones estudiantiles</p>
    </div>
    <button class="btn-nueva" on:click={() => showCreateModal = true}>
      <span class="plus">+</span>
      Nueva Esquela
    </button>
  </div>

  <!-- Panel de Filtros Avanzados -->
  <div class="filters-panel">
    <h3>
      <span class="icon-inline">{@html getIconSvg('search')}</span>
      Filtros de Búsqueda
    </h3>
    <div class="filters-grid">
      <div class="filter-group">
        <label for="name-filter">Nombre Estudiante</label>
        <input 
          id="name-filter"
          type="text" 
          placeholder="Buscar por nombre..."
          bind:value={nameFilter}
        />
      </div>

      <div class="filter-group">
        <label for="course-filter">Curso</label>
        <select id="course-filter" bind:value={selectedCourse}>
          <option value={null}>-- Todos los cursos --</option>
          {#each courses as course}
            <option value={course.id_curso}>{course.nombre_curso}</option>
          {/each}
        </select>
      </div>

      <div class="filter-group">
        <label for="type-filter">Tipo</label>
        <select id="type-filter" bind:value={typeFilter}>
          <option value={null}>-- Todos --</option>
          <option value="reconocimiento">Reconocimiento</option>
          <option value="orientacion">Orientación</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="year-filter">Año</label>
        <input 
          id="year-filter"
          type="number" 
        placeholder="2025"
          bind:value={selectedYear}
          min="2020"
          max="2030"
        />
      </div>

      <div class="filter-group">
        <label for="month-filter">Mes</label>
        <select id="month-filter" bind:value={selectedMonth}>
          <option value={null}>-- Todos --</option>
          <option value={1}>Enero</option>
          <option value={2}>Febrero</option>
          <option value={3}>Marzo</option>
          <option value={4}>Abril</option>
          <option value={5}>Mayo</option>
          <option value={6}>Junio</option>
          <option value={7}>Julio</option>
          <option value={8}>Agosto</option>
          <option value={9}>Septiembre</option>
          <option value={10}>Octubre</option>
          <option value={11}>Noviembre</option>
          <option value={12}>Diciembre</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="date-from">Desde</label>
        <input 
          id="date-from"
          type="date" 
          bind:value={dateFrom}
        />
      </div>

      <div class="filter-group">
        <label for="date-to">Hasta</label>
        <input 
          id="date-to"
          type="date" 
          bind:value={dateTo}
        />
      </div>
    </div>

    <div class="filter-actions">
      <button class="btn-filter" on:click={cargarDatos}>
        <span class="icon-inline">{@html getIconSvg('search')}</span>
        Buscar
      </button>
      <button class="btn-secondary" on:click={resetFilters}>
        <span class="icon-inline">{@html getIconSvg('refresh')}</span>
        Limpiar Filtros
      </button>
      <button class="btn-stats" on:click={loadAggregateByCourse}>
        <span class="icon-inline">{@html getIconSvg('bar-chart')}</span>
        Estadísticas por Curso
      </button>
      <button class="btn-ranking" on:click={() => loadRanking('student')}>
        <span class="icon-inline">{@html getIconSvg('trophy')}</span>
        Ranking Estudiantes
      </button>
    </div>
  </div>

  <!-- Panel de Estadísticas por Curso -->
  {#if showStats && aggregatedByCourse.length > 0}
    <div class="stats-panel">
      <div class="stats-header">
        <h3>
          <span class="icon-inline">{@html getIconSvg('bar-chart')}</span>
          Esquelas por Curso
        </h3>
        <button class="btn-close" on:click={() => showStats = false} aria-label="Cerrar">
          <span>{@html getIconSvg('x')}</span>
        </button>
      </div>
      <div class="stats-grid">
        {#each aggregatedByCourse as stat}
          <div class="stat-card">
            <div class="stat-course">{stat.curso}</div>
            <div class="stat-counts">
              <span class="stat-r">
                <span class="icon-inline">{@html getIconSvg('trophy')}</span>
                R{stat.reconocimiento}
              </span>
              <span class="stat-o">
                <span class="icon-inline">{@html getIconSvg('clipboard-list')}</span>
              O{stat.orientacion}
              </span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Panel de Ranking -->
  {#if showRanking && rankingData.length > 0}
    <div class="ranking-panel">
      <div class="ranking-header">
        <h3>
          <span class="icon-inline">{@html getIconSvg('trophy')}</span>
          Ranking de Estudiantes
        </h3>
        <button class="btn-close" on:click={() => showRanking = false} aria-label="Cerrar">
          <span>{@html getIconSvg('x')}</span>
        </button>
      </div>
      <table class="ranking-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Estudiante</th>
            <th>Total</th>
            <th>Reconocimientos</th>
            <th>Orientaciones</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each rankingData as rank}
            <tr>
              <td class="pos-{rank.posicion}">{rank.posicion}</td>
              <td>{rank.nombre}</td>
              <td><strong>{rank.total}</strong></td>
              <td>
                <span class="icon-inline">{@html getIconSvg('trophy')}</span>
                {rank.reconocimiento}
              </td>
              <td>
                <span class="icon-inline">{@html getIconSvg('clipboard-list')}</span>
                {rank.orientacion}
              </td>
              <td>
                <button class="btn-details" on:click={() => loadStudentStats(rank.id)}>
                  Ver Detalle
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <!-- Panel de Estadísticas de Estudiante -->
  {#if studentStats}
    <div class="student-stats-panel">
      <div class="student-stats-header">
        <h3>
          <span class="icon-inline">{@html getIconSvg('trending-up')}</span>
          Estadísticas del Estudiante
        </h3>
        <button class="btn-close" on:click={() => studentStats = null} aria-label="Cerrar">
          <span>{@html getIconSvg('x')}</span>
        </button>
      </div>
      <div class="student-stats-content">
        <p><strong>Total de esquelas:</strong> {studentStats.total}</p>
        <div class="codes-summary">
          <div class="code-item">
            <span class="code-label">
              <span class="icon-inline">{@html getIconSvg('trophy')}</span>
              Reconocimientos:
            </span>
            <span class="code-value">{studentStats.codigos_resumen?.reconocimiento || 0}</span>
          </div>
          <div class="code-item">
            <span class="code-label">
              <span class="icon-inline">{@html getIconSvg('clipboard-list')}</span>
              Orientaciones:
            </span>
            <span class="code-value">{studentStats.codigos_resumen?.orientacion || 0}</span>
          </div>
        </div>
        {#if dateFrom || dateTo}
          <p class="date-range">
            <small>Rango: {dateFrom || 'inicio'} → {dateTo || 'hoy'}</small>
          </p>
        {/if}
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Cargando esquelas...</p>
    </div>
  {:else if error}
    <div class="error">
      <p>
        <span class="icon-inline">{@html getIconSvg('alert-circle')}</span>
        {error}
      </p>
      <button class="btn-retry" on:click={cargarDatos}>Reintentar</button>
    </div>
  {:else}
    <!-- Categorías -->
    <div class="categorias">
      {#each obtenerCategorias() as categoria}
        <button 
          class="categoria-card"
          class:active={categoriaSeleccionada === categoria.nombre}
          on:click={() => seleccionarCategoria(categoria.nombre)}
        >
          <div class="categoria-header">
            <span class="categoria-titulo">{categoria.nombre}</span>
            <span class="categoria-icono">{@html getIconSvg(categoria.icono)}</span>
          </div>
          <span class="categoria-cantidad">{categoria.cantidad}</span>
        </button>
      {/each}
    </div>

    <!-- Buscador -->
    <div class="buscador">
      <span class="icono-buscar">{@html getIconSvg('search')}</span>
      <input 
        type="text" 
        placeholder="Buscar por observaciones o tipo de código..."
        bind:value={searchQuery}
      />
    </div>

    <!-- Grid de Esquelas -->
    <div class="esquelas-grid">
      {#each filtrarEsquelas() as esquela}
        {@const primerCodigo = obtenerPrimerCodigo(esquela)}
        <div class="esquela-card" class:reconocimiento={primerCodigo.tipo === 'reconocimiento'}>
          <div class="esquela-header">
            <span class="esquela-icono">{@html getIconSvg(tipoIconos[primerCodigo.tipo] || 'file')}</span>
            <span class="esquela-fecha">{formatearFecha(esquela.fecha)}</span>
          </div>
          
          <!-- Información del estudiante y curso -->
          {#if esquela.estudiante}
            {@const curso = studentToCourseMap.get(esquela.estudiante.id_estudiante)}
            <div class="esquela-student-info">
              <div class="student-name">
                <span class="icon-inline">{@html getIconSvg('user')}</span>
                <strong>{esquela.estudiante.nombres} {esquela.estudiante.apellido_paterno} {esquela.estudiante.apellido_materno}</strong>
              </div>
              <div class="student-details">
                {#if esquela.estudiante.ci}
                  <span class="student-ci">CI: {esquela.estudiante.ci}</span>
                {/if}
                {#if curso}
                  <span class="student-course">
                    <span class="icon-inline">{@html getIconSvg('book-open')}</span>
                    {curso.nombre_curso || `${curso.grado}${curso.paralelo}`}
                  </span>
                {/if}
              </div>
            </div>
          {/if}
          
          <h3 class="esquela-titulo">{primerCodigo.descripcion}</h3>
          
          <div class="esquela-info">
            <div class="info-item">
              <span class="info-label">Código:</span>
              <span class="info-valor">{primerCodigo.codigo}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Tipo:</span>
              <span class="info-valor">{primerCodigo.tipo}</span>
            </div>
          </div>
          
          <p class="esquela-descripcion">{esquela.observaciones}</p>
          
          {#if esquela.codigos.length > 1}
            <div class="codigos-adicionales">
              <span class="codigos-label">Códigos adicionales:</span>
              {#each esquela.codigos.slice(1) as codigo}
                <span class="codigo-tag">{codigo.codigo}</span>
              {/each}
            </div>
          {/if}
          
          <div class="esquela-footer">
            <span class="esquela-id">ID: {esquela.id_esquela}</span>
            <button 
              class="btn-eliminar"
              on:click={() => eliminarEsquela(esquela.id_esquela)}
              title="Eliminar esquela"
              aria-label="Eliminar esquela"
            >
              {@html getIconSvg('trash')}
            </button>
          </div>
        </div>
      {/each}

      {#if filtrarEsquelas().length === 0}
        <div class="no-results">
          <p>No se encontraron esquelas que coincidan con los filtros.</p>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Modal para crear esquela -->
  <CreateEsquelaModal 
    bind:show={showCreateModal} 
    {codigos}
    on:created={cargarDatos}
  />
</div>

