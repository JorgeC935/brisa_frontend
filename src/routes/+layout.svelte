<script lang="ts">
	import '../app.css';
	import './layout.css'
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { authService } from '$lib/services/auth.js';
	import { getIconSvg } from '$lib/components/svg.js';
	
	let { children } = $props();
	let isAuthenticated = $state(false);
	let currentUser = $state<any>(null);
	let sidebarCollapsed = $state(false);
	let reportesManuallyToggled = $state(false);
	const canManageCodigos = $derived(userIsAdmin(currentUser));
	
	// Usar la store $page para obtener la ruta actual reactivamente
	const currentPath = $derived($page.url.pathname);
	
	// Auto-expandir reportes basado en la ruta actual o si fue abierto manualmente
	const reportesExpanded = $derived(currentPath.startsWith('/reportes') || reportesManuallyToggled);

	const menuItems = [
		{ label: 'Dashboard', icon: 'dashboard', href: '#' },
		{ label: 'Usuarios y Roles', icon: 'users', href: '#' },
		{ label: 'Estudiantes', icon: 'graduation-cap', href: '#' },
		{ label: 'Profesores', icon: 'user', href: '#' },
		{ label: 'Cursos', icon: 'book-open', href: '#' },
		{ label: 'Administrativos', icon: 'briefcase', href: '/administrativos' },
		{ label: 'Retiros Tempranos', icon: 'clock', href: '#' },
		{ label: 'Incidentes', icon: 'alert-triangle', href: '#' },
		{ label: 'Esquelas', icon: 'clipboard-list', href: '/esquelas' },
		{ label: 'Administración', icon: 'settings', href: '#' },
	];

	const reportesSubmenu = [
		{ 
			label: 'Estudiantes',
			icon: 'graduation-cap',
			items: [
				{ label: 'Listado General', href: '/reportes' },
				{ label: 'Apoderados', href: '/reportes/estudiantes/apoderados' },
				{ label: 'Contactos', href: '/reportes/estudiantes/contactos' },
				{ label: 'Distribución Etaria', href: '/reportes/estudiantes/edades' },
				{ label: 'Historial de Cursos', href: '/reportes/estudiantes/historial' }
			]
		},
		{
			label: 'Académico',
			icon: 'book-open',
			items: [
				{ label: 'Profesores Asignados', href: '/reportes/academico/profesores' },
				{ label: 'Materias por Nivel', href: '/reportes/academico/materias' },
				{ label: 'Carga Académica', href: '/reportes/academico/carga-academica' },
				{ label: 'Cursos por Gestión', href: '/reportes/academico/cursos-gestion' }
			]
		},
		{
			label: 'Esquelas',
			icon: 'clipboard-list',
			items: [
				{ label: 'Por Emisor', href: '/reportes/esquelas/por-emisor' },
				{ label: 'Por Rango de Fechas', href: '/reportes/esquelas/por-fecha' },
				{ label: 'Códigos Frecuentes', href: '/reportes/esquelas/codigos-frecuentes' }
			]
		}
	];

	onMount(() => {
		isAuthenticated = authService.isAuthenticated();
		currentUser = authService.getUserData();

		// Proteger rutas
		if (!isAuthenticated && $page.url.pathname !== '/login') {
			window.location.href = '/login';
		}
	});

	function userIsAdmin(user: any): boolean {
		return Boolean(user?.roles?.some((role: any) => 
			role?.nombre === 'Administrativo' || role?.nombre === 'Administrador' || role?.nombre === 'Director'
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

	function toggleReportes() {
		if (!currentPath.startsWith('/reportes')) {
			reportesManuallyToggled = !reportesManuallyToggled;
		}
		if (sidebarCollapsed) {
			sidebarCollapsed = false;
		}
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
					
					<!-- Menú expandible de Reportes -->
					<div class="nav-item-group">
						<button 
							class="nav-item nav-item-expandable" 
							class:active={currentPath.startsWith('/reportes')}
							onclick={toggleReportes}
							title="Reportes"
						>
							<span class="nav-icon">{@html getIconSvg('bar-chart')}</span>
							{#if !sidebarCollapsed}
								<span class="nav-label">Reportes</span>
								<span class="expand-icon" class:expanded={reportesExpanded}>
									{@html getIconSvg(reportesExpanded ? 'chevron-down' : 'chevron-right')}
								</span>
							{/if}
						</button>
						
						{#if reportesExpanded && !sidebarCollapsed}
							<div class="submenu">
								{#each reportesSubmenu as section}
									<div class="submenu-section">
										<div class="submenu-section-header">
											<span class="submenu-icon">{@html getIconSvg(section.icon)}</span>
											<span class="submenu-label">{section.label}</span>
										</div>
										<div class="submenu-items">
											{#each section.items as subItem}
												<a 
													href={subItem.href} 
													class="submenu-item"
													class:active={currentPath === subItem.href}
												>
													{subItem.label}
												</a>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
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

