<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { administrativosService, type Administrativo, type Cargo } from '$lib/services/administrativos.js';
	import { getIconSvg } from '$lib/components/svg.js';
	import NuevoAdministrativo from './NuevoAdministrativo.svelte';
	import EditarAdministrativos from './EditarAdministrativos.svelte';

	const POLLING_INTERVAL = 5000;
	const FAST_POLLING_INTERVAL = 2000;

	// ==================== ESTADO ====================
	let administrativos: Administrativo[] = [];
	let cargos: Cargo[] = [];
	let cargoSeleccionado = 'todos';
	let estadoSeleccionado = 'todos';
	let searchQuery = '';
	let mostrarNuevo = false;
	let mostrarEditar = false;
	let administrativoEditando: Administrativo | null = null;
	let isLoading = false;
	let hasChanges = false;
	let polling: number | null = null;
	let errorCargando: string | null = null;
	let timeoutCarga: number | null = null;

	// ==================== UTILIDADES ====================
	function hash(data: any) {
		return JSON.stringify(data)
			.split('')
			.reduce((a, b) => (a = (a << 5) - a + b.charCodeAt(0)) & a, 0)
			.toString();
	}

	function initials(a: Administrativo) {
		const ap = a.apellido_paterno?.[0] || a.apellido_materno?.[0] || '';
		const n = a.nombres.split(' ')[0]?.[0] || '';
		return (ap + n).toUpperCase() || '?';
	}

	function fullName(a: Administrativo) {
		const ape = a.apellido_paterno || a.apellido_materno || '';
		return `${ape} ${a.nombres}`.trim() || a.nombre_completo || 'Sin nombre';
	}

	// ==================== CARGA DATOS ====================
	let lastHash = '';

	async function cargarAdministrativos(silent = false) {
		if (!silent) {
			isLoading = true;
			errorCargando = null;
			// Timeout de 10 segundos
			if (timeoutCarga) clearTimeout(timeoutCarga);
			timeoutCarga = setTimeout(() => {
				if (isLoading) {
					errorCargando = 'No se ha podido cargar los administrativos';
					isLoading = false;
				}
			}, 10000) as any;
		}
		try {
			const data = await administrativosService.getAdministrativos(true);
			const newHash = hash(data);

			// Only update if raw data actually changed
			if (newHash !== lastHash) {
				lastHash = newHash;
				administrativos = data;
				hasChanges = true;
			}
			errorCargando = null;
		} catch (err: any) {
			if (!silent) {
				errorCargando = 'No se ha podido cargar los administrativos';
				isLoading = false;
			}
		} finally {
			if (!silent) {
				if (timeoutCarga) {
					clearTimeout(timeoutCarga);
					timeoutCarga = null;
				}
				isLoading = false;
			}
			setTimeout(() => (hasChanges = false), 1000);
		}
	}

	function reintentarCarga() {
		errorCargando = null;
		cargarAdministrativos();
	}

	async function cargarCargos() {
		try {
			cargos = await administrativosService.getCargos();
		} catch {}
	}

	async function refrescar(silent = false) {
		await Promise.all([cargarAdministrativos(silent), cargarCargos()]);
	}

	function pollingStart(interval = POLLING_INTERVAL) {
		pollingStop();
		polling = setInterval(() => refrescar(true), interval) as any;
	}

	function pollingStop() {
		if (polling) clearInterval(polling);
		polling = null;
	}

	function pollingRapido() {
		pollingStop();
		pollingStart(FAST_POLLING_INTERVAL);
		setTimeout(() => pollingStart(POLLING_INTERVAL), 10000);
	}

	onMount(() => {
		refrescar();
		pollingStart();
		const vis = () => !document.hidden && refrescar(true);
		document.addEventListener('visibilitychange', vis);
		onDestroy(() => {
			pollingStop();
			document.removeEventListener('visibilitychange', vis);
		});
	});

	// ==================== ACCIONES ====================
	function abrirNuevo() {
		mostrarNuevo = true;
	}
	function abrirEditar(a: Administrativo) {
		administrativoEditando = a;
		mostrarEditar = true;
	}

	function cerrarForms() {
		mostrarNuevo = false;
		mostrarEditar = false;
		administrativoEditando = null;
	}

	async function onSave(e: CustomEvent<Administrativo>) {
		const saved = e.detail;
		const idx = administrativos.findIndex(
			(a) => (a.id ?? a.id_persona) === (saved.id ?? saved.id_persona)
		);
		if (idx >= 0) administrativos[idx] = saved;
		else administrativos = [...administrativos, saved];
		administrativos = administrativos;
		cerrarForms();
		await refrescar(true);
		pollingRapido();
	}

	function onDelete(e: CustomEvent<{ id: number }>) {
		administrativos = administrativos.filter((a) => (a.id ?? a.id_persona) !== e.detail.id);
		cerrarForms();
		refrescar(true);
	}

	// ==================== FILTROS ====================
	$: filtrados = administrativos.filter((a) => {
		const q = searchQuery.toLowerCase();
		const okNombre =
			a.nombres?.toLowerCase().includes(q) ||
			a.apellido_paterno?.toLowerCase().includes(q) ||
			a.nombre_completo?.toLowerCase().includes(q);
		const okCI = a.ci?.toLowerCase().includes(q) ?? false;
		const okCargo = a.nombre_cargo?.toLowerCase().includes(q) ?? false;
		const okArea = a.area_trabajo?.toLowerCase().includes(q) ?? false;
		const okCargoSelect =
			cargoSeleccionado === 'todos' || a.id_cargo?.toString() === cargoSeleccionado;
		const okEstadoSelect =
			estadoSeleccionado === 'todos' ||
			a.estado_laboral?.toLowerCase() === estadoSeleccionado.toLowerCase();
		return (okNombre || okCI || okCargo || okArea) && okCargoSelect && okEstadoSelect;
	});
</script>

{#if mostrarNuevo}
	<NuevoAdministrativo on:save={onSave} on:cancel={cerrarForms} />
{:else if mostrarEditar && administrativoEditando}
	<EditarAdministrativos
		administrativo={administrativoEditando}
		on:save={onSave}
		on:cancel={cerrarForms}
		on:delete={onDelete}
	/>
{:else}
	<div class="administrativos-container panel">
		<!-- TÍTULO -->
		<div class="title-section">
			<h1>Administrativos</h1>
			<p>Gestiona la información del personal administrativo</p>
		</div>

		<!-- BOTÓN A LA DERECHA (DEBAJO DEL TÍTULO) -->
		<div class="button-row">
			<button class="btn-nuevo" on:click={abrirNuevo}>+ Nuevo Administrativo</button>
		</div>

		<!-- FILTROS -->
		<div class="filters">
			<input
				type="text"
				placeholder="Buscar por nombre, CI, cargo o área..."
				bind:value={searchQuery}
			/>
			<div class="filter-group">
				<select bind:value={cargoSeleccionado}>
					<option value="todos">Todos los cargos</option>
					{#each cargos as cargo}
						<option value={cargo.id_cargo.toString()}>{cargo.nombre_cargo}</option>
					{/each}
				</select>
				<select bind:value={estadoSeleccionado}>
					<option value="todos">Todos los estados</option>
					<option value="activo">Activo</option>
					<option value="inactivo">Inactivo</option>
					<option value="retirado">Retirado</option>
					<option value="suspendido">Suspendido</option>
				</select>
			</div>
		</div>

		<!-- GRID DE ADMINISTRATIVOS -->
		<div class="grid-container">
			{#if isLoading}
				<div class="loading-state">
					<div class="spinner"></div>
					<p>Cargando administrativos...</p>
				</div>
			{:else if errorCargando}
				<div class="error-state">
					{@html getIconSvg('alert-circle')}
					<p>{errorCargando}</p>
					<button class="btn-reintentar" on:click={reintentarCarga}>
						{@html getIconSvg('refresh-cw')}
						Reintentar
					</button>
				</div>
			{:else if filtrados.length === 0}
				<div class="empty-state">
					<p>No se encontraron administrativos.</p>
				</div>
			{:else}
				<div class="grid" class:updating={hasChanges}>
					{#each filtrados as a (a.id ?? a.id_persona ?? Math.random())}
						<div class="card" on:click={() => abrirEditar(a)}>
							<div class="avatar-circle">{initials(a)}</div>

							<div class="info">
								<div class="name-line">
									<h3>{fullName(a)}</h3>

									{#if a.nombre_cargo}
										<span class="cargo-pill">{a.nombre_cargo}</span>
									{/if}
								</div>

								{#if a.area_trabajo}
									<div class="area-row">
										<span class="area-tag">{a.area_trabajo}</span>
									</div>
								{/if}

								<div class="footer">
									<div class="horas">
										{@html getIconSvg('clock')}
										<span>{a.horas_semana ?? 40} h/sem</span>
									</div>

									<span
										class="estado {a.estado_laboral?.toLowerCase() === 'activo'
											? 'activo'
											: 'inactivo'}"
									>
										{a.estado_laboral || 'N/A'}
									</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	:root {
		--cyan: #00cfe6;
		--text: #1e293b;
		--muted: #64748b;
	}

	/* ==================== TÍTULO ==================== */
	.title-section {
		margin-bottom: 8px;
	}

	.title-section h1 {
		font-size: 1.8rem;
		color: var(--text);
		margin: 0 0 6px;
	}

	.title-section p {
		color: black;
		margin: 0;
	}

	/* ==================== BOTÓN A LA DERECHA ==================== */
	.button-row {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 24px;
	}

	.btn-nuevo {
		background: var(--cyan);
		color: white;
		border: none;
		padding: 10px 22px;
		border-radius: 10px;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		transition: 0.2s ease;
		box-shadow: 0 4px 10px rgba(0, 207, 230, 0.3);
	}

	.btn-nuevo:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 18px rgba(0, 207, 230, 0.4);
	}

	/* ==================== FILTROS ==================== */
	.filters {
		display: flex;
		gap: 16px;
		margin-bottom: 28px;
		align-items: center;
		flex-wrap: wrap;
	}

	.filters input {
		flex: 1;
		min-width: 280px;
		padding: 12px 18px;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		background: white;
		font-size: 0.95rem;
		color: black;
	}

	.filters input:focus {
		outline: none;
		border-color: var(--cyan);
	}

	.filter-group {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.filter-group select {
		padding: 12px 18px;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		background: white;
		font-size: 0.95rem;
		cursor: pointer;
		color: black;
	}

	.filter-group select:focus {
		outline: none;
		border-color: var(--cyan);
	}

	/* ==================== GRID CONTAINER ==================== */
	.grid-container {
		min-height: 200px;
	}

	/* ==================== LOADING STATE ==================== */
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		gap: 16px;
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid #e2e8f0;
		border-top: 4px solid var(--cyan);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.loading-state p {
		color: var(--muted);
		font-size: 0.95rem;
		margin: 0;
	}

	/* ==================== ERROR STATE ==================== */
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		gap: 16px;
	}

	.error-state svg {
		width: 48px;
		height: 48px;
		color: #ef4444;
	}

	.error-state p {
		color: #ef4444;
		font-size: 0.95rem;
		margin: 0;
		text-align: center;
	}

	.btn-reintentar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		background: var(--cyan);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-reintentar:hover {
		background: #00b8d4;
		transform: translateY(-1px);
	}

	.btn-reintentar svg {
		width: 16px;
		height: 16px;
	}

	/* ==================== EMPTY STATE ==================== */
	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
	}

	.empty-state p {
		color: var(--muted);
		font-size: 1rem;
		margin: 0;
	}

	/* ==================== GRID ==================== */
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 20px;
		transition: opacity 0.3s;
	}

	.grid.updating {
		opacity: 0.6;
	}

	/* ==================== CARD ==================== */
	.card {
		background: white;
		border-radius: 16px;
		padding: 16px;
		box-shadow: 0 3px 14px rgba(0, 0, 0, 0.06);
		border: 1px solid #f1f5f9;
		display: flex;
		gap: 16px;
		cursor: pointer;
		transition: 0.25s;
	}

	.card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 22px rgba(0, 0, 0, 0.12);
	}

	.avatar-circle {
		width: 52px;
		height: 52px;
		background: #9aa9ff;
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.2rem;
		flex-shrink: 0;
	}

	.name-line {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 6px;
		flex-wrap: wrap;
	}

	.name-line h3 {
		margin: 0;
		font-size: 1rem;
		color: var(--text);
	}

	.cargo-pill {
		background: linear-gradient(135deg, var(--cyan), #00a6b8);
		color: white;
		padding: 4px 10px;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.area-row {
		display: flex;
		gap: 6px;
		margin-bottom: 10px;
		flex-wrap: wrap;
	}

	.area-tag {
		background: #f1f5f9;
		padding: 3px 10px;
		border-radius: 6px;
		font-size: 0.8rem;
		color: black;
	}

	.footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 6px;
	}

	.horas {
		display: flex;
		align-items: center;
		gap: 6px;
		color: black;
		font-size: 0.85rem;
	}

	.horas svg {
		width: 14px;
		height: 14px;
	}

	.estado {
		padding: 4px 10px;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.estado.activo {
		background: #ecfdf5;
		color: #16a34a;
	}

	.estado.inactivo {
		background: #fffbeb;
		color: #d97706;
	}

	.panel {
		background: #fff;
		border-radius: 14px;
		padding: 20px;
		box-shadow: 0 6px 18px rgba(25, 40, 60, 0.02);
		border: 1px solid #eef6fa;
	}
</style>

