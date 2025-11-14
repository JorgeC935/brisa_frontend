<script lang="ts">
  import { onMount } from 'svelte';
  import { apiClient } from '$lib/services/api.js';
  import type { CodigoEsquela, CodigoEsquelaCreate, TipoCodigoEsquela } from '$lib/types/api.js';

  let codigos: CodigoEsquela[] = [];
  let loading = true;
  let error = '';
  
  // Modal states
  let showCreateModal = false;
  let showEditModal = false;
  let editingCodigo: CodigoEsquela | null = null;
  
  // Form data
  let formData: CodigoEsquelaCreate = {
    tipo: 'reconocimiento',
    codigo: '',
    descripcion: ''
  };
  
  // Filters
  let tipoFilter: TipoCodigoEsquela | null = null;
  let searchQuery = '';

  // SVG Icons helper
  function getIconSvg(iconName: string): string {
    const icons: Record<string, string> = {
      'trophy': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
      'clipboard-list': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>',
      'plus': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
      'edit': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>',
      'trash': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
      'search': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
      'x': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
      'alert-circle': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
      'code': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
    };
    return icons[iconName] || '';
  }

  onMount(async () => {
    await loadCodigos();
  });

  async function loadCodigos() {
    try {
      loading = true;
      error = '';
      codigos = await apiClient.getCodigosEsquelas(tipoFilter || undefined);
    } catch (err: any) {
      console.error('Error cargando códigos:', err);
      error = err.message || 'Error cargando códigos';
      codigos = [];
    } finally {
      loading = false;
    }
  }

  function openCreateModal() {
    formData = {
      tipo: 'reconocimiento',
      codigo: '',
      descripcion: ''
    };
    showCreateModal = true;
  }

  function openEditModal(codigo: CodigoEsquela) {
    editingCodigo = codigo;
    formData = {
      tipo: codigo.tipo,
      codigo: codigo.codigo,
      descripcion: codigo.descripcion
    };
    showEditModal = true;
  }

  function closeModals() {
    showCreateModal = false;
    showEditModal = false;
    editingCodigo = null;
    formData = {
      tipo: 'reconocimiento',
      codigo: '',
      descripcion: ''
    };
  }

  async function handleCreate() {
    try {
      if (!formData.codigo.trim() || !formData.descripcion.trim()) {
        alert('Por favor complete todos los campos');
        return;
      }

      await apiClient.createCodigoEsquela(formData);
      await loadCodigos();
      closeModals();
    } catch (err: any) {
      console.error('Error creando código:', err);
      alert('Error al crear el código: ' + (err.message || 'Error desconocido'));
    }
  }

  async function handleUpdate() {
    try {
      if (!editingCodigo) return;
      
      if (!formData.codigo.trim() || !formData.descripcion.trim()) {
        alert('Por favor complete todos los campos');
        return;
      }

      await apiClient.updateCodigoEsquela(editingCodigo.id_codigo, formData);
      await loadCodigos();
      closeModals();
    } catch (err: any) {
      console.error('Error actualizando código:', err);
      alert('Error al actualizar el código: ' + (err.message || 'Error desconocido'));
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Está seguro de que desea eliminar este código?')) {
      return;
    }

    try {
      await apiClient.deleteCodigoEsquela(id);
      await loadCodigos();
    } catch (err: any) {
      console.error('Error eliminando código:', err);
      alert('Error al eliminar el código: ' + (err.message || 'Error desconocido'));
    }
  }

  function filterCodigos(): CodigoEsquela[] {
    let filtered = codigos;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.codigo.toLowerCase().includes(query) ||
        c.descripcion.toLowerCase().includes(query) ||
        c.tipo.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  function getTipoIcon(tipo: string): string {
    return tipo === 'reconocimiento' ? 'trophy' : 'clipboard-list';
  }

  function getTipoColor(tipo: string): string {
    return tipo === 'reconocimiento' ? 'tipo-reconocimiento' : 'tipo-orientacion';
  }
</script>

<div class="codigos-container">
  <!-- Header -->
  <div class="header">
    <div>
      <h1 class="titulo">Códigos de Esquela</h1>
      <p class="subtitulo">Gestiona los códigos de reconocimiento y orientación</p>
    </div>
    <button class="btn-nueva" on:click={openCreateModal}>
      <span class="icon-inline">{@html getIconSvg('plus')}</span>
      Nuevo Código
    </button>
  </div>

  <!-- Filters -->
  <div class="filters-panel">
    <div class="filter-row">
      <div class="search-box">
        <span class="icon-inline">{@html getIconSvg('search')}</span>
        <input 
          type="text" 
          placeholder="Buscar por código, descripción o tipo..."
          bind:value={searchQuery}
        />
      </div>

      <div class="filter-group">
        <label for="tipo-filter">Filtrar por tipo:</label>
        <select id="tipo-filter" bind:value={tipoFilter} on:change={loadCodigos}>
          <option value={null}>Todos</option>
          <option value="reconocimiento">Reconocimiento</option>
          <option value="orientacion">Orientación</option>
        </select>
      </div>
    </div>
  </div>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Cargando códigos...</p>
    </div>
  {:else if error}
    <div class="error">
      <p>
        <span class="icon-inline">{@html getIconSvg('alert-circle')}</span>
        {error}
      </p>
      <button class="btn-retry" on:click={loadCodigos}>Reintentar</button>
    </div>
  {:else}
    <!-- Códigos Table -->
    <div class="table-container">
      <table class="codigos-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Código</th>
            <th>Tipo</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each filterCodigos() as codigo}
            <tr>
              <td class="id-cell">{codigo.id_codigo}</td>
              <td class="codigo-cell">
                <span class="codigo-badge">
                  <span class="icon-inline">{@html getIconSvg('code')}</span>
                  {codigo.codigo}
                </span>
              </td>
              <td>
                <span class="tipo-badge {getTipoColor(codigo.tipo)}">
                  <span class="icon-inline">{@html getIconSvg(getTipoIcon(codigo.tipo))}</span>
                  {codigo.tipo}
                </span>
              </td>
              <td class="descripcion-cell">{codigo.descripcion}</td>
              <td class="actions-cell">
                <button 
                  class="btn-icon btn-edit" 
                  on:click={() => openEditModal(codigo)}
                  title="Editar"
                  aria-label="Editar código"
                >
                  {@html getIconSvg('edit')}
                </button>
                <button 
                  class="btn-icon btn-delete" 
                  on:click={() => handleDelete(codigo.id_codigo)}
                  title="Eliminar"
                  aria-label="Eliminar código"
                >
                  {@html getIconSvg('trash')}
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if filterCodigos().length === 0}
        <div class="no-results">
          <p>No se encontraron códigos.</p>
        </div>
      {/if}
    </div>

    <!-- Totales -->
    <div class="stats-footer">
      <div class="stat-item">
        <span class="stat-label">Total de códigos:</span>
        <span class="stat-value">{codigos.length}</span>
      </div>
      <div class="stat-item">
        <span class="icon-inline">{@html getIconSvg('trophy')}</span>
        <span class="stat-label">Reconocimientos:</span>
        <span class="stat-value">{codigos.filter(c => c.tipo === 'reconocimiento').length}</span>
      </div>
      <div class="stat-item">
        <span class="icon-inline">{@html getIconSvg('clipboard-list')}</span>
        <span class="stat-label">Orientaciones:</span>
        <span class="stat-value">{codigos.filter(c => c.tipo === 'orientacion').length}</span>
      </div>
    </div>
  {/if}
</div>

<!-- Create Modal -->
{#if showCreateModal}
  <div class="modal-overlay" on:click={closeModals}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Crear Nuevo Código</h2>
        <button class="btn-close" on:click={closeModals} aria-label="Cerrar">
          {@html getIconSvg('x')}
        </button>
      </div>

      <form on:submit|preventDefault={handleCreate}>
        <div class="form-group">
          <label for="create-tipo">Tipo:</label>
          <select id="create-tipo" bind:value={formData.tipo} required>
            <option value="reconocimiento">Reconocimiento</option>
            <option value="orientacion">Orientación</option>
          </select>
        </div>

        <div class="form-group">
          <label for="create-codigo">Código:</label>
          <input 
            id="create-codigo"
            type="text" 
            bind:value={formData.codigo}
            placeholder="Ej: R01, O01"
            required
          />
        </div>

        <div class="form-group">
          <label for="create-descripcion">Descripción:</label>
          <textarea 
            id="create-descripcion"
            bind:value={formData.descripcion}
            placeholder="Describe el código..."
            rows="3"
            required
          ></textarea>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" on:click={closeModals}>
            Cancelar
          </button>
          <button type="submit" class="btn-primary">
            <span class="icon-inline">{@html getIconSvg('plus')}</span>
            Crear Código
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Edit Modal -->
{#if showEditModal && editingCodigo}
  <div class="modal-overlay" on:click={closeModals}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Editar Código</h2>
        <button class="btn-close" on:click={closeModals} aria-label="Cerrar">
          {@html getIconSvg('x')}
        </button>
      </div>

      <form on:submit|preventDefault={handleUpdate}>
        <div class="form-group">
          <label for="edit-tipo">Tipo:</label>
          <select id="edit-tipo" bind:value={formData.tipo} required>
            <option value="reconocimiento">Reconocimiento</option>
            <option value="orientacion">Orientación</option>
          </select>
        </div>

        <div class="form-group">
          <label for="edit-codigo">Código:</label>
          <input 
            id="edit-codigo"
            type="text" 
            bind:value={formData.codigo}
            placeholder="Ej: R01, O01"
            required
          />
        </div>

        <div class="form-group">
          <label for="edit-descripcion">Descripción:</label>
          <textarea 
            id="edit-descripcion"
            bind:value={formData.descripcion}
            placeholder="Describe el código..."
            rows="3"
            required
          ></textarea>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" on:click={closeModals}>
            Cancelar
          </button>
          <button type="submit" class="btn-primary">
            <span class="icon-inline">{@html getIconSvg('edit')}</span>
            Actualizar Código
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .codigos-container {
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

  .filters-panel {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .filter-row {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .search-box {
    flex: 1;
    min-width: 250px;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.625rem 1rem;
  }

  .search-box input {
    border: none;
    outline: none;
    background: transparent;
    flex: 1;
    font-size: 0.9rem;
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .filter-group label {
    font-size: 0.9rem;
    color: #64748b;
    white-space: nowrap;
  }

  .filter-group select {
    padding: 0.625rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.9rem;
    background: white;
    cursor: pointer;
  }

  .table-container {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 1.5rem;
  }

  .codigos-table {
    width: 100%;
    border-collapse: collapse;
  }

  .codigos-table thead {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  }

  .codigos-table th {
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    color: #475569;
    font-size: 0.9rem;
    border-bottom: 2px solid #e2e8f0;
  }

  .codigos-table td {
    padding: 1rem;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
  }

  .codigos-table tbody tr:hover {
    background: #f8fafc;
  }

  .id-cell {
    font-weight: 600;
    color: #64748b;
    width: 60px;
  }

  .codigo-cell {
    width: 150px;
  }

  .codigo-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    color: #1e40af;
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .tipo-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.875rem;
    border-radius: 20px;
    font-weight: 500;
    font-size: 0.85rem;
  }

  .tipo-reconocimiento {
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    color: #065f46;
  }

  .tipo-orientacion {
    background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
    color: #92400e;
  }

  .descripcion-cell {
    max-width: 400px;
  }

  .actions-cell {
    width: 100px;
  }

  .btn-icon {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.375rem;
    border-radius: 6px;
    transition: background-color 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .btn-edit {
    color: #3b82f6;
  }

  .btn-edit:hover {
    background: #eff6ff;
  }

  .btn-delete {
    color: #ef4444;
  }

  .btn-delete:hover {
    background: #fef2f2;
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
    display: flex;
    align-items: center;
    gap: 0.5rem;
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

  .no-results {
    padding: 3rem;
    text-align: center;
    color: #64748b;
  }

  .stats-footer {
    display: flex;
    gap: 2rem;
    padding: 1.5rem;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    flex-wrap: wrap;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #475569;
    font-size: 0.9rem;
  }

  .stat-label {
    color: #64748b;
  }

  .stat-value {
    font-weight: 700;
    color: #22d3ee;
    font-size: 1.1rem;
  }

  /* Modal Styles */
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
    padding: 1rem;
  }

  .modal-content {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .modal-header h2 {
    margin: 0;
    color: #1e293b;
    font-size: 1.5rem;
  }

  .btn-close {
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }

  .btn-close:hover {
    background: #dc2626;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #475569;
    font-weight: 500;
    font-size: 0.9rem;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.95rem;
    transition: border-color 0.2s;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #22d3ee;
  }

  .form-group textarea {
    resize: vertical;
    font-family: inherit;
  }

  .modal-footer {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
  }

  .btn-secondary,
  .btn-primary {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-secondary {
    background: #e2e8f0;
    color: #475569;
  }

  .btn-secondary:hover {
    background: #cbd5e1;
  }

  .btn-primary {
    background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(34, 211, 238, 0.3);
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(34, 211, 238, 0.4);
  }

  /* Icon styles */
  :global(.icon-inline) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    vertical-align: middle;
  }

  :global(.icon-inline svg) {
    width: 100%;
    height: 100%;
  }
</style>
