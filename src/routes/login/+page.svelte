<!--src/router/Usuarios y Roles/auth-->
<script lang="ts">
  import { authStore } from '../../lib/stores/Usuarios_Roles/auth.svelte'

  let usuario = $state('');
  let contrasena = $state('');
  let loading = $state(false);
  let error = $state('');

  async function handleLogin(e: Event) {
    e.preventDefault();
    
    if (!usuario.trim() || !contrasena.trim()) {
      error = 'Por favor complete todos los campos';
      return;
    }

    loading = true;
    error = '';

    try {
      await authStore.login(usuario, contrasena);
      window.location.href = '/esquelas';
    } catch (err: any) {
      error = err.message || 'Usuario o contraseña incorrectos';
      console.error('Error de login:', err);
    } finally {
      loading = false;
    }
  }
</script>

<div class="login-page">
  <div class="login-container">
    <!-- Logo y Títulos -->
    <div class="header-section">
      <div class="logo-circle">
        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
          <path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
      </div>
      <h1 class="sistema-title">Sistema BRISA</h1>
      <h2 class="colegio-title">Colegio Británico de Tarija</h2>
    </div>

    <!-- Card de Login -->
    <div class="login-card">
      <div class="card-header">
        <h3>Iniciar Sesión</h3>
        <p>Ingresa tus credenciales para acceder al sistema</p>
      </div>

      <form onsubmit={handleLogin}>
        {#if error}
          <div class="error-banner">
            {error}
          </div>
        {/if}

        <div class="form-group">
          <label for="usuario">Usuario</label>
          <div class="input-wrapper">
            <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <input
              id="usuario"
              type="text"
              bind:value={usuario}
              placeholder="Ingresa tu usuario"
              disabled={loading}
              autocomplete="username"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="contrasena">Contraseña</label>
          <div class="input-wrapper">
            <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              id="contrasena"
              type="password"
              bind:value={contrasena}
              placeholder="Ingresa tu contraseña"
              disabled={loading}
              autocomplete="current-password"
            />
          </div>
        </div>

        <button type="button" class="forgot-password" onclick={() => console.log('Recuperar contraseña')}>
          ¿Olvidaste tu contraseña?
        </button>

        <button type="submit" class="btn-login" disabled={loading}>
          {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  </div>

  <!-- Botón de ayuda -->
  <button class="help-button" aria-label="Ayuda">
    <span>?</span>
  </button>
</div>

<style>
  @import './Login.css';
</style>