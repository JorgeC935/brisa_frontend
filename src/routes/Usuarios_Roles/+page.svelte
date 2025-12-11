<script lang="ts">
  import { onMount } from "svelte";
  import { usersStore } from '../../lib/stores/Usuarios_Roles/users.svelte';
  import { personasStore } from '../../lib/stores/Usuarios_Roles/personas.svelte';
  import RolesTable from "./roles/tables/RolesTable.svelte";
  import RoleModal from "./roles/modals/RoleModal.svelte";
  import RoleDetailModal from "./roles/modals/RoleDetailModal.svelte";
  import PermissionModulesModal from "./permisos/modals/PermissionModulesModal.svelte";
  import PermissionsTable from "./permisos/tables/PermissionsTable.svelte";
  import AccessLogsTable from "./bitacora/tables/AccessLogsTable.svelte";
  import PersonasTable from "./users/tables/PersonasTable.svelte";
  import PermisoDetailModal from "./permisos/modals/PermissionDetailModal.svelte";
  import type { Role, Permission } from '../../lib/types/Usuarios_Roles/users';
  import type { Persona } from '../../lib/types/Usuarios_Roles/personas';
  import { bitacoraStore } from '../../lib/stores/Usuarios_Roles/bitacora.svelte';
  import BitacoraTable from "./bitacora/tables/BitacoraTable.svelte";
  import BitacoraFilters from "./bitacora/modals/BitacoraFilters.svelte";
  import BitacoraDetailModal from "./bitacora/modals/BitacoraDetailModal.svelte";
  import type { RegistroBitacora, FiltrosBitacora } from '../../lib/types/Usuarios_Roles/bitacora'

  type Tab = "personas" | "roles" | "permisos" | "bitacora";
  let activeTab = $state<Tab>("personas");

  // Estados para los modales de roles
  let showRoleModal = $state(false);
  let showRoleDetailModal = $state(false);
  let selectedRole = $state<Role | null>(null);

  // Estados para personas
  let showPersonaModal = $state(false);
  let showPersonaDetailModal = $state(false);
  let selectedPersona = $state<Persona | null>(null);

  // Estados para Permisos (Modal de Módulos)
  let isModulesModalOpen = $state(false);
  let selectedPermissionModules = $state<string[]>([]);
  let selectedPermissionAction = $state("");
  let selectedPermissionDescription = $state("");

  // Estados para bitácora
  let selectedRegistro = $state<RegistroBitacora | null>(null);
  let showBitacoraDetailModal = $state(false);

  onMount(async () => {
    console.log("🔄 ========== INICIO CARGA DE DATOS ==========");

    try {
      console.log("1️⃣ Cargando usuarios...");
      await usersStore.loadUsers();
      console.log("✅ Usuarios cargados:", usersStore.users.length);
    } catch (error) {
      console.error("❌ ERROR en usersStore.loadUsers():", error);
    }

    try {
      console.log("2️⃣ Cargando personas...");
      await personasStore.loadAll();
      console.log("✅ Personas cargadas:", personasStore.personas.length);
    } catch (error) {
      console.error("❌ ERROR en personasStore.loadAll():", error);
    }

    console.log("🏁 ========== FIN CARGA DE DATOS ==========");
  });

  // ========== MANEJADORES DE PERSONAS ==========
  function onCreateNewPersona() {
    console.log("Crear nueva persona");
    selectedPersona = null;
    showPersonaModal = true;
  }

  function onEditPersona(persona: Persona) {
    console.log("Editar persona:", persona);
    selectedPersona = persona;
    showPersonaModal = true;
  }

  async function onDeletePersona(id: number) {
    const persona = personasStore.getPersonaById(id);
    if (persona?.tiene_usuario) {
      alert("No se puede eliminar una persona con usuario asociado");
      return;
    }
  }

  function onViewDetailPersona(persona: Persona) {
    console.log("Ver detalle de persona:", persona);
    selectedPersona = persona;
    showPersonaDetailModal = true;
  }

  // ========== MANEJADORES DE ROLES ==========
  function onCreateNewRole() {
    selectedRole = null;
    showRoleModal = true;
  }

  function onEditRole(role: Role) {
    selectedRole = role;
    showRoleModal = true;
  }

  async function onDeleteRole(roleId: number) {
    await usersStore.loadUsers();
  }

  function onViewDetailRole(role: Role) {
    selectedRole = role;
    showRoleDetailModal = true;
  }

  function handleCloseRoleModal() {
    showRoleModal = false;
    selectedRole = null;
  }

  function handleCloseRoleDetailModal() {
    showRoleDetailModal = false;
    selectedRole = null;
  }

  async function handleSaveRole(role: Role) {
    console.log("✅ Rol guardado:", role);
    await usersStore.loadUsers();
    showRoleModal = false;
    selectedRole = null;
  }

  function handleEditFromDetail(role: Role) {
    showRoleDetailModal = false;
    selectedRole = role;
    showRoleModal = true;
  }

  // ========== MANEJADORES DE PERMISOS ==========
  function onEditPermission(permission: Permission) {
    console.log("Editar permiso:", permission);
  }

  function onDeletePermission(permissionId: number) {
    console.log("Eliminar permiso:", permissionId);
  }

  function onRefresh() {
    usersStore.refreshPermissions();
  }

  function handleViewDetail(
    modulos: string[],
    accion: string,
    descripcion: string,
  ) {
    console.log("📋 Abriendo modal de módulos:", { accion, modulos });
    selectedPermissionModules = modulos;
    selectedPermissionAction = accion;
    selectedPermissionDescription = descripcion;
    isModulesModalOpen = true;
  }

  function handleCloseModulesModal() {
    console.log("❌ Cerrando modal de módulos");
    isModulesModalOpen = false;
  }

  // ========== MANEJADORES DE BITÁCORA ==========
  async function handleTabChange(tab: Tab) {
    const oldTab = activeTab;
    activeTab = tab;

    // CU-07 Paso 1: Cargar datos al abrir el módulo de auditoría
    if (tab === "bitacora" && oldTab !== "bitacora") {
      console.log("📋 CU-07 Paso 1: Abriendo módulo de auditoría...");

      // Mostrar loading mientras carga
      bitacoraStore.isLoading = true;

      try {
        // Cargar TODO en paralelo
        await Promise.all([
          bitacoraStore.cargarTiposAcciones(),
          bitacoraStore.cargarRegistros(),
          bitacoraStore.cargarEstadisticas(),
        ]);

        console.log("✅ Módulo de auditoría cargado");
        console.log(
          "📊 Tipos de acciones:",
          bitacoraStore.tiposAcciones.length,
        );
        console.log("📋 Registros:", bitacoraStore.registros.length);
      } catch (error) {
        console.error("❌ Error al cargar auditoría:", error);
      }
    }
  }

  async function handleBuscarBitacora(filtros: FiltrosBitacora) {
    await bitacoraStore.aplicarFiltros(filtros);
  }

  async function handleLimpiarFiltros() {
    await bitacoraStore.limpiarFiltros();
  }

  function handleViewBitacoraDetail(registro: RegistroBitacora) {
    selectedRegistro = registro;
    showBitacoraDetailModal = true;
  }

  function handleCloseBitacoraDetailModal() {
    showBitacoraDetailModal = false;
    selectedRegistro = null;
  }

  async function handlePageChangeBitacora(page: number) {
    await bitacoraStore.cambiarPagina(page);
  }

  async function handleRefreshBitacora() {
    await bitacoraStore.refrescar();
  }

  // Computed para stats combinadas
  let combinedStats = $derived({
    totalUsuarios: usersStore.stats?.totalUsuarios ?? 0,
    rolesActivos: usersStore.stats?.rolesActivos ?? 0,
    totalPermisos: usersStore.stats?.totalPermisos ?? 0,
    accesosHoy: usersStore.stats?.accesosHoy ?? 0,
    totalPersonas: personasStore.stats?.total_personas ?? 0,
    profesores: personasStore.stats?.total_profesores ?? 0,
    administrativos: personasStore.stats?.total_administrativos ?? 0,
  });
</script>

<div class="usuarios-view-container">
  <div class="view-header">
    <h1 class="view-title">Administración de Personas, Roles y Permisos</h1>
    <p class="view-subtitle">
      Gestiona el acceso y los permisos de los usuarios del sistema BRISA
    </p>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon stat-personas">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>
      <div class="stat-content">
        <p class="stat-label">Total Personas</p>
        <p class="stat-value">{combinedStats.totalPersonas}</p>
        <p class="stat-detail">
          {combinedStats.profesores} prof. / {combinedStats.administrativos} admin.
        </p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon stat-users">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      </div>
      <div class="stat-content">
        <p class="stat-label">Total Usuarios</p>
        <p class="stat-value">{combinedStats.totalUsuarios}</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon stat-roles">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      </div>
      <div class="stat-content">
        <p class="stat-label">Roles Activos</p>
        <p class="stat-value">{combinedStats.rolesActivos}</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon stat-permissions">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <div class="stat-content">
        <p class="stat-label">Permisos</p>
        <p class="stat-value">{combinedStats.totalPermisos}</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon stat-access">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <div class="stat-content">
        <p class="stat-label">Accesos Hoy</p>
        <p class="stat-value">{combinedStats.accesosHoy}</p>
      </div>
    </div>
  </div>

  <!-- TABS -->
  <div class="tabs-container">
    <button
      class="tab-button"
      class:active={activeTab === "personas"}
      onclick={() => handleTabChange("personas")}
    >
      <svg
        class="tab-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
      <span class="tab-text">Personas</span>
    </button>

    <button
      class="tab-button"
      class:active={activeTab === "roles"}
      onclick={() => handleTabChange("roles")}
    >
      <svg
        class="tab-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
      <span class="tab-text">Roles</span>
    </button>

    <button
      class="tab-button"
      class:active={activeTab === "permisos"}
      onclick={() => handleTabChange("permisos")}
    >
      <svg
        class="tab-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
      <span class="tab-text">Permisos</span>
    </button>

    <button
      class="tab-button"
      class:active={activeTab === "bitacora"}
      onclick={() => handleTabChange("bitacora")}
    >
      <svg
        class="tab-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <span class="tab-text">Bitácora</span>
    </button>
  </div>

  <!-- CONTENEDOR CON SCROLL INTERNO -->
  <div class="tab-content-wrapper">
    {#if activeTab === "personas"}
      {#if personasStore.isLoading}
        <div class="loading-container">
          <div class="spinner"></div>
          <p>Cargando personas...</p>
        </div>
      {:else if personasStore.error}
        {#if personasStore.error.includes("403") || personasStore.error.includes("permiso")}
          <!-- Estado sin permiso -->
          <div class="no-permission-state">
            <div class="no-permission-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 class="no-permission-title">Acceso Restringido</h3>
            <p class="no-permission-message">
              No tienes permisos para ver la gestión de personas. Contacta al
              administrador del sistema si necesitas acceso.
            </p>
          </div>
        {:else}
          <!-- Error genérico -->
          <div class="error-container">
            <svg
              class="error-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p class="error-message">{personasStore.error}</p>
            <button class="btn-retry" onclick={() => personasStore.loadAll()}>
              Reintentar Personas
            </button>
          </div>
        {/if}
      {:else}
        <PersonasTable
          personas={personasStore.personas}
          loading={personasStore.isLoading}
          onEdit={onEditPersona}
          onDelete={onDeletePersona}
          onViewDetail={onViewDetailPersona}
          onRefresh={() => personasStore.loadAll()}
        />
      {/if}
    {:else if activeTab === "roles"}
      {#if usersStore.error && (usersStore.error.includes("403") || usersStore.error.includes("permiso"))}
        <div class="no-permission-state">
          <div class="no-permission-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 class="no-permission-title">Acceso Restringido</h3>
          <p class="no-permission-message">
            No tienes permisos para ver la gestión de roles. Contacta al
            administrador del sistema si necesitas acceso.
          </p>
        </div>
      {:else}
        <RolesTable
          roles={usersStore.roles}
          onEdit={onEditRole}
          onDelete={onDeleteRole}
          onViewDetail={onViewDetailRole}
          onCreateNew={onCreateNewRole}
        />
      {/if}
    {:else if activeTab === "permisos"}
      {#if usersStore.error && (usersStore.error.includes("403") || usersStore.error.includes("permiso"))}
        <div class="no-permission-state">
          <div class="no-permission-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 class="no-permission-title">Acceso Restringido</h3>
          <p class="no-permission-message">
            No tienes permisos para ver la gestión de permisos. Contacta al
            administrador del sistema si necesitas acceso.
          </p>
        </div>
      {:else}
        <PermissionsTable
          permissions={usersStore.permissions}
          onEdit={onEditPermission}
          onDelete={onDeletePermission}
          onViewDetail={handleViewDetail}
          {onRefresh}
        />
      {/if}
    {:else if activeTab === "bitacora"}
      {#if bitacoraStore.isLoading && bitacoraStore.registros.length === 0}
        <!-- Loading inicial -->
        <div class="loading-container">
          <div class="spinner"></div>
          <p>Cargando auditoría...</p>
        </div>
      {:else if bitacoraStore.error && (bitacoraStore.error.includes("403") || bitacoraStore.error.includes("permiso"))}
        <div class="no-permission-state">
          <div class="no-permission-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 class="no-permission-title">Acceso Restringido</h3>
          <p class="no-permission-message">
            No tienes permisos para ver la auditoría del sistema. Contacta al
            administrador.
          </p>
        </div>
      {:else}
        <div class="bitacora-content">
          <!-- Filtros -->
          <BitacoraFilters
            usuarios={usersStore.users}
            tiposAcciones={bitacoraStore.tiposAcciones}
            onBuscar={handleBuscarBitacora}
            onLimpiar={handleLimpiarFiltros}
          />

          <!-- Botón refrescar -->
          <div class="bitacora-actions">
            <button
              class="btn-refresh"
              onclick={handleRefreshBitacora}
              disabled={bitacoraStore.isLoading}
            >
              <svg
                class:spinning={bitacoraStore.isLoading}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refrescar
            </button>
          </div>

          <!-- Tabla -->
          <BitacoraTable
            registros={bitacoraStore.registros}
            loading={bitacoraStore.isLoading}
            total={bitacoraStore.total}
            page={bitacoraStore.page}
            pages={bitacoraStore.pages}
            onPageChange={handlePageChangeBitacora}
            onViewDetail={handleViewBitacoraDetail}
          />
        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- MODALES DE ROLES -->
<RoleModal
  role={selectedRole}
  isOpen={showRoleModal}
  onClose={handleCloseRoleModal}
  onSave={handleSaveRole}
/>

<RoleDetailModal
  role={selectedRole}
  isOpen={showRoleDetailModal}
  onClose={handleCloseRoleDetailModal}
  onEdit={handleEditFromDetail}
/>

<PermissionModulesModal
  isOpen={isModulesModalOpen}
  accion={selectedPermissionAction}
  descripcion={selectedPermissionDescription}
  modulos={selectedPermissionModules}
  onClose={handleCloseModulesModal}
/>

<BitacoraDetailModal
  registro={selectedRegistro}
  isOpen={showBitacoraDetailModal}
  onClose={handleCloseBitacoraDetailModal}
/>

<style>
  @import './UsuariosView.css';
</style>