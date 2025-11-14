<script lang="ts">
  import { onMount } from 'svelte';
  import { apiClient } from '$lib/services/api.js';
  import type { EsquelaResponse, CodigoEsquela } from '$lib/types/api.js';
  import CreateEsquelaModal from '$lib/components/CreateEsquelaModal.svelte';

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

  // Helper para renderizar SVG icons
  function getIconSvg(iconName: string): string {
    const icons: Record<string, string> = {
      'trophy': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
      'clipboard-list': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>',
      'book-open': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
      'medal': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><path d="M11 12 5.12 2.2"/><path d="m13 12 5.88-9.8"/><path d="M8 7h8"/><circle cx="12" cy="17" r="5"/><path d="M12 18v-2h-.5"/></svg>',
      'heart': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
      'star': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
      'search': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
      'bar-chart': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>',
      'refresh': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>',
      'trending-up': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
      'x': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
      'trash': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
      'alert-circle': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
      'file': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>',
      'user': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
    };
    return icons[iconName] || icons['file'];
  }

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

<style>
  .esquelas-container {
    padding: 2rem;
    background-color: #f5f7fa;
    min-height: 100vh;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
  }

  .titulo {
    font-size: 1.875rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
  }

  .subtitulo {
    color: #64748b;
    font-size: 0.95rem;
    margin: 0;
  }

  .btn-nueva {
    background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 12px rgba(34, 211, 238, 0.3);
  }

  .btn-nueva:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(34, 211, 238, 0.4);
  }

  .plus {
    font-size: 1.25rem;
    font-weight: 300;
  }

  .categorias {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .categoria-card {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.25rem;
    cursor: pointer;
    transition: all 0.3s;
  }

  .categoria-card:hover {
    border-color: #22d3ee;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(34, 211, 238, 0.15);
  }

  .categoria-card.active {
    border-color: #22d3ee;
    background: linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%);
  }

  .categoria-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .categoria-titulo {
    color: #64748b;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .categoria-icono {
    font-size: 1.5rem;
    opacity: 0.7;
  }

  .categoria-cantidad {
    font-size: 2rem;
    font-weight: 600;
    color: #22d3ee;
  }

  .buscador {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 0.875rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 2rem;
  }

  .icono-buscar {
    font-size: 1.25rem;
    color: #94a3b8;
  }

  .buscador input {
    border: none;
    outline: none;
    flex: 1;
    font-size: 0.95rem;
    color: #1e293b;
  }

  .buscador input::placeholder {
    color: #94a3b8;
  }

  .esquelas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 1.5rem;
  }

  .esquela-card {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.3s;
  }

  .esquela-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  .esquela-card.reconocimiento {
    border-color: #22d3ee;
    background: linear-gradient(135deg, rgba(34, 211, 238, 0.05) 0%, white 100%);
  }

  .esquela-student-info {
    margin: 0.75rem 0;
    padding: 0.75rem;
    background: #f8fafc;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .student-name,
  .course-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #475569;
  }

  .student-details {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding-left: 1.5rem;
    font-size: 0.85rem;
    color: #64748b;
    flex-wrap: wrap;
  }

  .student-ci {
    color: #64748b;
  }

  .student-course {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: #475569;
  }

  .student-course .icon-inline {
    width: 14px;
    height: 14px;
    color: #22d3ee;
  }

  .student-name strong {
    color: #1e293b;
    font-weight: 600;
  }

  .student-name .icon-inline {
    width: 16px;
    height: 16px;
    color: #22d3ee;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem;
    color: #64748b;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e2e8f0;
    border-top: 4px solid #22d3ee;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    background: #fef2f2;
    border: 2px solid #fca5a5;
    border-radius: 12px;
    margin: 2rem 0;
  }

  .error p {
    color: #dc2626;
    margin: 0 0 1rem 0;
  }

  .btn-retry {
    background: #dc2626;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .btn-retry:hover {
    background: #b91c1c;
  }

  .codigos-adicionales {
    margin: 1rem 0;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
  }

  .codigos-label {
    display: block;
    font-size: 0.8rem;
    color: #64748b;
    margin-bottom: 0.5rem;
  }

  .codigo-tag {
    display: inline-block;
    background: #f1f5f9;
    color: #475569;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    margin-right: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .btn-eliminar {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .btn-eliminar:hover {
    background: #fef2f2;
  }

  .esquela-id {
    font-size: 0.8rem;
    color: #94a3b8;
  }

  .no-results {
    grid-column: 1 / -1;
    text-align: center;
    padding: 4rem;
    color: #64748b;
  }

  .esquela-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .esquela-icono {
    font-size: 2rem;
    background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
  }

  .esquela-fecha {
    background: #22d3ee;
    color: white;
    padding: 0.375rem 0.875rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .esquela-titulo {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 1rem 0;
  }

  .esquela-info {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1rem;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .info-label {
    font-size: 0.8rem;
    color: #64748b;
  }

  .info-valor {
    font-weight: 600;
    color: #1e293b;
  }

  .esquela-descripcion {
    color: #475569;
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0 0 1rem 0;
  }

  .esquela-footer {
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* Estilos para SVG icons inline */
  :global(.icon-inline) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    vertical-align: middle;
    margin-right: 0.375rem;
  }

  :global(.icon-inline svg) {
    width: 100%;
    height: 100%;
  }

  h3 :global(.icon-inline) {
    width: 1.5rem;
    height: 1.5rem;
  }

  .categoria-icono :global(svg) {
    width: 100%;
    height: 100%;
    opacity: 0.7;
  }

  .icono-buscar :global(svg) {
    width: 1.25rem;
    height: 1.25rem;
    color: #94a3b8;
  }

  .btn-close :global(svg) {
    width: 1rem;
    height: 1rem;
  }

  /* Nuevos estilos para filtros avanzados */
  .filters-panel {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .filters-panel h3 {
    margin: 0 0 1rem 0;
    color: #1e293b;
    font-size: 1.1rem;
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .filter-group label {
    font-size: 0.85rem;
    color: #64748b;
    font-weight: 500;
  }

  .filter-group input,
  .filter-group select {
    padding: 0.625rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.9rem;
    transition: border-color 0.2s;
  }

  .filter-group input:focus,
  .filter-group select:focus {
    outline: none;
    border-color: #22d3ee;
  }

  .filter-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .btn-filter,
  .btn-secondary,
  .btn-stats,
  .btn-ranking {
    padding: 0.625rem 1.25rem;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-filter {
    background: #22d3ee;
    color: white;
  }

  .btn-filter:hover {
    background: #06b6d4;
  }

  .btn-secondary {
    background: #e2e8f0;
    color: #475569;
  }

  .btn-secondary:hover {
    background: #cbd5e1;
  }

  .btn-stats {
    background: #10b981;
    color: white;
  }

  .btn-stats:hover {
    background: #059669;
  }

  .btn-ranking {
    background: #f59e0b;
    color: white;
  }

  .btn-ranking:hover {
    background: #d97706;
  }

  /* Panel de Estadísticas */
  .stats-panel {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .stats-header,
  .ranking-header,
  .student-stats-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .stats-header h3,
  .ranking-header h3,
  .student-stats-header h3 {
    margin: 0;
    color: #1e293b;
  }

  .btn-close {
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
  }

  .btn-close:hover {
    background: #dc2626;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }

  .stat-card {
    background: linear-gradient(135deg, #f0fdfa 0%, #f0f9ff 100%);
    border: 2px solid #22d3ee;
    border-radius: 10px;
    padding: 1rem;
    text-align: center;
  }

  .stat-course {
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.75rem;
    font-size: 1.05rem;
  }

  .stat-counts {
    display: flex;
    justify-content: center;
    gap: 1rem;
    font-size: 0.95rem;
  }

  .stat-r {
    color: #059669;
    font-weight: 600;
  }

  .stat-o {
    color: #d97706;
    font-weight: 600;
  }

  /* Panel de Ranking */
  .ranking-panel {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .ranking-table {
    width: 100%;
    border-collapse: collapse;
  }

  .ranking-table th {
    background: #f8fafc;
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    color: #475569;
    border-bottom: 2px solid #e2e8f0;
  }

  .ranking-table td {
    padding: 0.875rem 0.75rem;
    border-bottom: 1px solid #f1f5f9;
  }

  .ranking-table tr:hover {
    background: #f8fafc;
  }

  .pos-1 {
    color: #f59e0b;
    font-weight: 700;
    font-size: 1.1rem;
  }

  .pos-2 {
    color: #94a3b8;
    font-weight: 600;
  }

  .pos-3 {
    color: #cd7f32;
    font-weight: 600;
  }

  .btn-details {
    background: #22d3ee;
    color: white;
    border: none;
    padding: 0.375rem 0.875rem;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .btn-details:hover {
    background: #06b6d4;
  }

  /* Panel de Estadísticas de Estudiante */
  .student-stats-panel {
    background: white;
    border: 2px solid #22d3ee;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .student-stats-content {
    background: #f0fdfa;
    padding: 1rem;
    border-radius: 8px;
  }

  .student-stats-content p {
    margin: 0 0 0.75rem 0;
    color: #1e293b;
  }

  .codes-summary {
    display: flex;
    gap: 2rem;
    margin-top: 1rem;
  }

  .code-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .code-label {
    font-size: 0.85rem;
    color: #64748b;
  }

  .code-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #22d3ee;
  }

  .date-range {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #cbd5e1;
  }

  .date-range small {
    color: #64748b;
  }

</style>