<script lang="ts">
	import '../app.css';
	import './layout.css'
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { authService } from '$lib/services/auth.js';
	import { getIconSvg } from '$lib/components/svg.js';
	
	let { children } = $props();
	let isAuthenticated = $state(false);
	let currentUser = $state<any>(null);
	let currentPath = $state('');
	let sidebarCollapsed = $state(false);
	const canManageCodigos = $derived(userIsAdmin(currentUser));

	const menuItems = [
		{ label: 'Dashboard', icon: 'dashboard', href: '#' },
		{ label: 'Usuarios y Roles', icon: 'users', href: '#' },
		{ label: 'Estudiantes', icon: 'graduation-cap', href: '#' },
		{ label: 'Profesores', icon: 'user', href: '#' },
		{ label: 'Cursos', icon: 'book-open', href: '#' },
		{ label: 'Administrativos', icon: 'briefcase', href: '#' },
		{ label: 'Retiros Tempranos', icon: 'clock', href: '#' },
		{ label: 'Incidentes', icon: 'alert-triangle', href: '#' },
		{ label: 'Esquelas', icon: 'clipboard-list', href: '/esquelas' },
		{ label: 'Reportes', icon: 'bar-chart', href: '#' },
		{ label: 'Administración', icon: 'settings', href: '#' },
	];

	onMount(() => {
		currentPath = window.location.pathname;
		isAuthenticated = authService.isAuthenticated();
		currentUser = authService.getUserData();

		// Proteger rutas
		if (!isAuthenticated && currentPath !== '/login') {
			window.location.href = '/login';
		}
	});

	function userIsAdmin(user: any): boolean {
		return Boolean(user?.roles?.some((role: any) => 
			role?.nombre === 'Administrativo' || role?.nombre === 'Administrador'
		));
	}

	async function handleLogout() {
		if (confirm('¿Está seguro que desea cerrar sesión?')) {
			await authService.logout();
			window.location.href = '/login';
		}
	}

	function toggleSidebar() {
		sidebarCollapsed = !sidebarCollapsed;
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if currentPath === '/login'}
	{@render children?.()}
{:else if isAuthenticated}
	<div class="app-layout">
		<aside class="sidebar" class:collapsed={sidebarCollapsed}>
			<div class="sidebar-header">
				<button class="toggle-sidebar-btn" onclick={toggleSidebar} aria-label="Toggle sidebar">
					{@html getIconSvg('menu')}
				</button>
				{#if !sidebarCollapsed}
					<div class="logo">
						<span class="logo-icon">{@html getIconSvg('graduation-cap')}</span>
						<div class="logo-text">
							<h1>BRISA</h1>
							<span>Sistema Escolar</span>
						</div>
					</div>
				{/if}
			</div>

			<nav class="sidebar-nav">
				{#each menuItems as item}
					<a 
						href={item.href} 
						class="nav-item" 
						class:active={currentPath === item.href && item.href !== '#'}
						title={item.label}
					>
						<span class="nav-icon">{@html getIconSvg(item.icon)}</span>
						{#if !sidebarCollapsed}
							<span class="nav-label">{item.label}</span>
						{/if}
					</a>
				{/each}
				{#if canManageCodigos}
					<a 
						href="/codigos" 
						class="nav-item" 
						class:active={currentPath === '/codigos'}
						title="Códigos Esquelas"
					>
						<span class="nav-icon">{@html getIconSvg('code')}</span>
						{#if !sidebarCollapsed}
							<span class="nav-label">Códigos Esquelas</span>
						{/if}
					</a>
				{/if}
			</nav>

			<div class="sidebar-footer">
				<button class="nav-item logout-btn" onclick={handleLogout} title="Cerrar Sesión">
					<span class="nav-icon">{@html getIconSvg('log-out')}</span>
					{#if !sidebarCollapsed}
						<span class="nav-label">Cerrar Sesión</span>
					{/if}
				</button>
			</div>
		</aside>

		<div class="main-content-wrapper">
			<header class="top-bar">
				<div class="search-bar">
					
				</div>
				<div class="top-bar-actions">
					<button class="action-btn notification-btn">
						{@html getIconSvg('bell')}
						<span class="badge">3</span>
					</button>
					<div class="user-profile">
						<div class="avatar">
							{currentUser?.nombres?.[0] || 'U'}{currentUser?.apellido_paterno?.[0] || ''}
						</div>
						<div class="user-info">
							<span class="user-name">{currentUser?.nombres || 'Usuario'} {currentUser?.apellido_paterno || ''}</span>
							<span class="user-role">{currentUser?.roles?.[0]?.nombre || 'Rol'}</span>
						</div>
					</div>
				</div>
			</header>
			<main class="content-area">
				{@render children?.()}
			</main>
		</div>
	</div>
{/if}

