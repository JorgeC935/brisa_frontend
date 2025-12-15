<!--src/routes.+layout.svelte-->

<script lang="ts">
	import "../app.css";
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { authStore } from "$lib/stores/Usuarios_Roles/auth.svelte";
	import { getIconSvg } from "$lib/components/svg.js";
	import type { ModuloSistema } from "$lib/types/Usuarios_Roles/auth";
	import LogoutDialog from "./LogoutDialog.svelte";

	let { children } = $props();
	let sidebarCollapsed = $state(false);
	let reportesManuallyToggled = $state(false);
	let showLogoutDialog = $state(false);
	const isAuthenticated = $derived(authStore.isAuthenticated);
	const currentUser = $derived(authStore.user);
	const canManageCodigos = $derived(authStore.esAdministrador);

	// Usar la store $page para obtener la ruta actual reactivamente
	const currentPath = $derived($page.url.pathname);

	// Auto-expandir reportes basado en la ruta actual o si fue abierto manualmente
	const reportesExpanded = $derived(
		currentPath.startsWith("/reportes") || reportesManuallyToggled,
	);

	const menuItems = [
		{
			label: "Dashboard",
			icon: "dashboard",
			href: "/",
			modulo: null as ModuloSistema | null,
		},
		{
			label: "Usuarios y Roles",
			icon: "users",
			href: "/Usuarios_Roles",
			modulo: "usuarios" as ModuloSistema,
		},
		{
			label: "Profesores",
			icon: "user",
			href: "/profesores",
			modulo: "profesores" as ModuloSistema,
		},
		{
			label: "Cursos",
			icon: "book-open",
			href: "/profesores/cursos",
			modulo: "profesores" as ModuloSistema,
		},
		{
			label: "Materias",
			icon: "book",
			href: "/profesores/materias",
			modulo: "profesores" as ModuloSistema,
		},
		{
			label: "Administrativos",
			icon: "briefcase",
			href: "/administrativos",
			modulo: "administracion" as ModuloSistema,
		},
		{
			label: "Retiros Tempranos",
			icon: "clock",
			href: "/retiros",
			modulo: "retiros_tempranos" as ModuloSistema,
		},
		{
			label: "Incidentes",
			icon: "alert-triangle",
			href: "/incidentes",
			modulo: "incidentes" as ModuloSistema,
		},
		{
			label: "Esquelas",
			icon: "clipboard-list",
			href: "/esquelas",
			modulo: "esquelas" as ModuloSistema,
		},
		{
			label: "Administración",
			icon: "settings",
			href: "/administracion",
			modulo: "administracion" as ModuloSistema,
		},
	];

	const reportesSubmenu = [
		{
			label: "Usuarios y Roles",
			icon: "users",
			items: [{ label: "Listado de Usuarios", href: "/Usuarios_Roles" }],
		},
		{
			label: "Estudiantes",
			icon: "graduation-cap",
			items: [
				{ label: "Listado General", href: "/reportes" },
				{
					label: "Apoderados",
					href: "/reportes/estudiantes/apoderados",
				},
				{ label: "Contactos", href: "/reportes/estudiantes/contactos" },
				{
					label: "Distribución Etaria",
					href: "/reportes/estudiantes/edades",
				},
				{
					label: "Historial de Cursos",
					href: "/reportes/estudiantes/historial",
				},
			],
		},
		{
			label: "Académico",
			icon: "book-open",
			items: [
				{
					label: "Profesores Asignados",
					href: "/reportes/academico/profesores",
				},
				{
					label: "Materias por Nivel",
					href: "/reportes/academico/materias",
				},
				{
					label: "Carga Académica",
					href: "/reportes/academico/carga-academica",
				},
				{
					label: "Cursos por Gestión",
					href: "/reportes/academico/cursos-gestion",
				},
			],
		},
		{
			label: "Esquelas",
			icon: "clipboard-list",
			items: [
				{ label: "Por Emisor", href: "/reportes/esquelas/por-emisor" },
				{
					label: "Por Rango de Fechas",
					href: "/reportes/esquelas/por-fecha",
				},
				{
					label: "Códigos Frecuentes",
					href: "/reportes/esquelas/codigos-frecuentes",
				},
			],
		},
	];

	// Función para verificar si el usuario puede acceder a un módulo
	function canAccessModule(modulo: ModuloSistema | null): boolean {
		if (!modulo) return true; // Dashboard y módulos sin permiso siempre accesibles
		return authStore.puedeAccederModulo(modulo);
	}

	function goToProfile() {
		goto("/Usuarios_Roles/users/");
	}

	onMount(async () => {
		// Inicializar authStore
		await authStore.init();

		// Si no está en login y no está autenticado, redirigir
		if (currentPath !== "/login" && !authStore.isAuthenticated) {
			goto("/login");
		}
	});

	function handleLogout() {
		showLogoutDialog = true;
	}

	function confirmLogout() {
		authStore.logout();
		goto("/login");
		showLogoutDialog = false;
	}

	function cancelLogout() {
		showLogoutDialog = false;
	}

	function userIsAdmin(user: any): boolean {
		return Boolean(
			user?.roles?.some(
				(role: any) =>
					role?.nombre === "Administrativo" ||
					role?.nombre === "Administrador" ||
					role?.nombre === "Director",
			),
		);
	}

	function toggleSidebar() {
		sidebarCollapsed = !sidebarCollapsed;
	}

	function toggleReportes() {
		if (!currentPath.startsWith("/reportes")) {
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

{#if currentPath === "/login"}
	{@render children?.()}
{:else if isAuthenticated}
	<div class="app-layout">
		<aside class="sidebar" class:collapsed={sidebarCollapsed}>
			<div class="sidebar-header">
				<button
					class="toggle-sidebar-btn"
					onclick={toggleSidebar}
					aria-label="Toggle sidebar"
				>
					{@html getIconSvg("menu")}
				</button>
				{#if !sidebarCollapsed}
					<div class="logo">
						<span class="logo-icon"
							>{@html getIconSvg("graduation-cap")}</span
						>
						<div class="logo-text">
							<h1>BRISA</h1>
							<span>Sistema Escolar</span>
						</div>
					</div>
				{/if}
			</div>

			<nav class="sidebar-nav">
				{#each menuItems as item}
					{#if canAccessModule(item.modulo)}
						<a
							href={item.href}
							class="nav-item"
							class:active={currentPath === item.href}
							title={item.label}
						>
							<span class="nav-icon"
								>{@html getIconSvg(item.icon)}</span
							>
							{#if !sidebarCollapsed}
								<span class="nav-label">{item.label}</span>
							{/if}
						</a>
					{/if}
				{/each}

				{#if canManageCodigos}
					<a
						href="/codigos"
						class="nav-item"
						class:active={currentPath === "/codigos"}
						title="Códigos Esquelas"
					>
						<span class="nav-icon">{@html getIconSvg("code")}</span>
						{#if !sidebarCollapsed}
							<span class="nav-label">Códigos Esquelas</span>
						{/if}
					</a>

					<!-- Menú expandible de Reportes -->
					<div class="nav-item-group">
						<button
							class="nav-item nav-item-expandable"
							class:active={currentPath.startsWith("/reportes")}
							onclick={toggleReportes}
							title="Reportes"
						>
							<span class="nav-icon"
								>{@html getIconSvg("bar-chart")}</span
							>
							{#if !sidebarCollapsed}
								<span class="nav-label">Reportes</span>
								<span
									class="expand-icon"
									class:expanded={reportesExpanded}
								>
									{@html getIconSvg(
										reportesExpanded
											? "chevron-down"
											: "chevron-right",
									)}
								</span>
							{/if}
						</button>

						{#if reportesExpanded && !sidebarCollapsed}
							<div class="submenu">
								{#each reportesSubmenu as section}
									<div class="submenu-section">
										<div class="submenu-section-header">
											<span class="submenu-icon"
												>{@html getIconSvg(
													section.icon,
												)}</span
											>
											<span class="submenu-label"
												>{section.label}</span
											>
										</div>
										<div class="submenu-items">
											{#each section.items as subItem}
												<a
													href={subItem.href}
													class="submenu-item"
													class:active={currentPath ===
														subItem.href}
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
				<button
					class="nav-item logout-btn"
					onclick={handleLogout}
					title="Cerrar Sesión"
				>
					<span class="nav-icon">{@html getIconSvg("log-out")}</span>
					{#if !sidebarCollapsed}
						<span class="nav-label">Cerrar Sesión</span>
					{/if}
				</button>
			</div>
		</aside>

		<div class="main-content-wrapper">
			<header class="top-bar">
				<div class="search-bar">
					<input type="text" placeholder="Buscar..." />
					<span class="search-icon">{@html getIconSvg("search")}</span
					>
				</div>
				<div class="top-bar-actions">
					<button class="action-btn notification-btn">
						{@html getIconSvg("bell")}
						<span class="badge">3</span>
					</button>
					<button class="user-profile" onclick={goToProfile}>
						<div class="avatar">
							{currentUser?.nombres?.[0] || "U"}{currentUser
								?.usuario?.[0] || ""}
						</div>
						<div class="user-info">
							<span class="user-name">
								{currentUser?.nombres || "Usuario"}
							</span>
							<span class="user-role">
								{currentUser?.rol || "Rol"}
							</span>
						</div>
					</button>
				</div>
			</header>
			<main class="content-area">
				{@render children?.()}
			</main>
		</div>
	</div>
{:else}
	<!-- Pantalla de carga mientras se verifica autenticación -->
	<div class="loading-container">
		<div class="spinner"></div>
		<p>Verificando sesión...</p>
	</div>
{/if}

<LogoutDialog
	bind:show={showLogoutDialog}
	on:confirm={confirmLogout}
	on:cancel={cancelLogout}
/>

<style>
	@import "./layout.css";
</style>
