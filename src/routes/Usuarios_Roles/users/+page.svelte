<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '../../../lib/services/api';
  import ModalCambiarPassword from './modals/ModalCambiarPassword.svelte';


  interface UserProfile {
    id_usuario: number;
    id_persona: number;
    usuario: string;
    correo: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    ci: string;
    telefono: string;
    direccion: string;
    tipo_persona: string;
    is_active: boolean;
  }

  let mostrarModalPassword = $state(false);
  let user = $state<UserProfile | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

 onMount(async () => {
    try {
      // 1. Obtener datos del usuario actual
      const meData: any = await api.getMe();
      
      // 2. Usar solo los datos de meData (que ya tiene toda la información)
      user = {
        id_usuario: meData.data.id_usuario,
        id_persona: meData.data.id_persona || 0,
        usuario: meData.data.usuario,
        correo: meData.data.correo,
        nombres: meData.data.nombres,
        apellido_paterno: meData.data.apellido_paterno,
        apellido_materno: meData.data.apellido_materno,
        ci: meData.data.ci,
        telefono: meData.data.telefono || 'No registrado',
        direccion: meData.data.direccion || 'No registrada',
        tipo_persona: meData.data.tipo_persona || 'N/A',
        is_active: meData.data.estado === 'activo'
      };
      
    } catch (err: any) {
      error = err.message || 'Error desconocido';
      console.error('Error cargando perfil:', err);
    } finally {
      loading = false;
    }
  });

  function goBack() {
    (window as any).navigateTo?.('dashboard');
  }
</script>

<!-- Cambiar max-w-2xl por w-full -->
<div class="w-full">
  
  {#if loading}
    <div class="flex items-center justify-center h-96">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p class="text-gray-600">Cargando información...</p>
      </div>
    </div>
    
  {:else if error}
    <div class="bg-white p-6 rounded-lg shadow-lg text-center">
      <p class="text-red-600 mb-4">❌ {error}</p>
      <button 
        onclick={() => location.reload()}
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Reintentar
      </button>
    </div>
    
  {:else if user}
    <!-- Header con botón volver -->
    <div class="flex items-center mb-6">
      <button 
        onclick={goBack}
        class="mr-4 p-2 bg-white hover:bg-gray-100 rounded-lg transition shadow-sm"
        title="Volver"
      >
        <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-3xl font-bold text-gray-800">Mi Perfil</h1>
    </div>

    <!-- Main Card con estilo azul -->
    <div class="bg-white rounded-xl shadow-lg overflow-hidden">
      <!-- Header del perfil con azul oscuro -->
      <div class="profile-header p-8 text-white">
        <div class="flex items-center gap-6">
          <div class="w-24 h-24 bg-white rounded-full flex items-center justify-center text-blue-900 text-3xl font-bold shadow-lg">
            {user.nombres.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 class="text-3xl font-bold">{user.nombres} {user.apellido_paterno}</h2>
            <p class="text-blue-100 mt-2">@{user.usuario}</p>
          </div>
        </div>
      </div>

      <!-- Contenido -->
      <div class="p-8">
        <!-- Grid de información -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Información Personal -->
          <div class="info-section">
            <h3 class="section-title">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Información Personal
            </h3>
            <div class="space-y-4">
              <div class="info-item">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label>Nombre Completo</label>
                <p>{user.nombres} {user.apellido_paterno} {user.apellido_materno}</p>
              </div>
              <div class="info-item">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label>Cédula de Identidad</label>
                <p>{user.ci}</p>
              </div>
              <div class="info-item">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label>Tipo de Persona</label>
                <p class="capitalize">{user.tipo_persona}</p>
              </div>
            </div>
          </div>

          <!-- Información de Contacto -->
          <div class="info-section">
            <h3 class="section-title">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Información de Contacto
            </h3>
            <div class="space-y-4">
              <div class="info-item">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label>Correo Electrónico</label>
                <p class="break-all">{user.correo}</p>
              </div>
              <div class="info-item">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label>Teléfono</label>
                <p>{user.telefono}</p>
              </div>
              <div class="info-item">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label>Dirección</label>
                <p>{user.direccion}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Información de Cuenta -->
        <div class="mt-8 pt-8 border-t border-gray-200">
          <h3 class="section-title mb-6">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Información de Cuenta
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="account-badge">
              <!-- svelte-ignore a11y_label_has_associated_control -->
              <label>Usuario</label>
              <p>{user.usuario}</p>
            </div>
            <div class="account-badge">
              <!-- svelte-ignore a11y_label_has_associated_control -->
              <label>ID de Usuario</label>
              <p>#{user.id_usuario}</p>
            </div>
            <div class="account-badge">
              <!-- svelte-ignore a11y_label_has_associated_control -->
              <label>Estado</label>
              <div class="flex items-center gap-2 mt-1">
                <div class="status-dot {user.is_active ? 'active' : 'inactive'}"></div>
                <p>{user.is_active ? 'Activo' : 'Inactivo'}</p>
              </div>
            </div>
            {#if user.id_persona}
              <div class="account-badge">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label>ID de Persona</label>
                <p>#{user.id_persona}</p>
              </div>
            {/if}
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="mt-8 flex gap-4 pt-6 border-t border-gray-200">
          <button class="btn-secondary" onclick={() => mostrarModalPassword = true}>
            Cambiar Contraseña
          </button>
        </div>
      </div>
    </div>
  {/if}
  
</div>

<!-- Modal de cambiar contraseña -->
<ModalCambiarPassword 
  bind:isOpen={mostrarModalPassword}
  onClose={() => mostrarModalPassword = false}
/>

<style>
  @import './UserInfo.css';
</style>