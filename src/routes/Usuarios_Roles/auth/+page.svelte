<!--src/components/SinAcceso.svelte-->
<script lang="ts">
  interface Props {
    modulo?: string;
    mensaje?: string;
  }

  let { 
    modulo = "este módulo",
    mensaje = "No tienes permisos para acceder a este módulo"
  }: Props = $props();
</script>

<div class="sin-acceso-container">
  <div class="sin-acceso-card">
    <div class="icon-container">
      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2" 
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
        />
      </svg>
    </div>
    
    <h2 class="title">Acceso Restringido</h2>
    <p class="message">{mensaje}</p>
    
    <div class="info-box">
      <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2" 
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
      </svg>
      <div class="info-content">
        <p class="info-title">¿Por qué veo esto?</p>
        <p class="info-text">
          Tu rol actual no tiene los permisos necesarios para acceder a <strong>{modulo}</strong>.
          Si necesitas acceso, contacta con un administrador del sistema.
        </p>
      </div>
    </div>

    <div class="actions">
      <button 
        class="btn-back" 
        onclick={() => window.history.back()}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M10 19l-7-7m0 0l7-7m-7 7h18" 
          />
        </svg>
        Volver
      </button>
      
      <button 
        class="btn-dashboard" 
        onclick={() => (window as any).navigateTo?.('dashboard')}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
          />
        </svg>
        Ir al Dashboard
      </button>
    </div>
  </div>
</div>

<style>
  @import './styles/SinAcceso.css';
</style>