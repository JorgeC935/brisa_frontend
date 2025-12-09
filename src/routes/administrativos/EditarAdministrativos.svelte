<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { administrativosService } from '$lib/services/administrativos.js';

	export let administrativo: any = null;

	const dispatch = createEventDispatcher<{
		save: any;
		cancel: void;
		delete: { id: number };
	}>();

	let administrativoData: any = {
		ci: '',
		nombres: '',
		apellido_paterno: '',
		apellido_materno: '',
		direccion: '',
		telefono: '',
		correo: '',
		id_cargo: null,
		estado_laboral: 'activo',
		años_experiencia: 0,
		fecha_ingreso: '',
		horario_entrada: '08:00',
		horario_salida: '16:00',
		area_trabajo: '',
		observaciones: ''
	};

	let formErrors = {
		ci: false,
		nombres: false,
		apellido_paterno: false,
		correo: false,
		telefono: false,
		direccion: false,
		id_cargo: false,
		años_experiencia: false,
		fecha_ingreso: false,
		area_trabajo: false,
		horario_entrada: false,
		horario_salida: false
	};

	let errorMessages = {
		ci: '',
		nombres: '',
		apellido_paterno: '',
		correo: '',
		telefono: '',
		direccion: '',
		id_cargo: '',
		años_experiencia: '',
		fecha_ingreso: '',
		area_trabajo: '',
		horario_entrada: '',
		horario_salida: ''
	};

	let cargos: any[] = [];
	let cargandoCargos = false;
	let guardando = false;
	let eliminando = false;
	let toastMessage = '';
	let toastType: 'success' | 'error' | 'info' = 'info';

	onMount(async () => {
		await cargarCargos();

		if (administrativo) {
			// Cargar datos del administrativo
			administrativoData = {
				ci: administrativo.ci || '',
				nombres: administrativo.nombres || '',
				apellido_paterno: administrativo.apellido_paterno || '',
				apellido_materno: administrativo.apellido_materno || '',
				direccion: administrativo.direccion || '',
				telefono: administrativo.telefono || '',
				correo: administrativo.correo || '',
				id_cargo: administrativo.id_cargo || null,
				estado_laboral: administrativo.estado_laboral || 'activo',
				años_experiencia: administrativo.años_experiencia || 0,
				fecha_ingreso: administrativo.fecha_ingreso || '',
				horario_entrada: administrativo.horario_entrada?.substring(0, 5) || '08:00',
				horario_salida: administrativo.horario_salida?.substring(0, 5) || '16:00',
				area_trabajo: administrativo.area_trabajo || '',
				observaciones: administrativo.observaciones || ''
			};
		}
	});

	async function cargarCargos() {
		cargandoCargos = true;
		try {
			cargos = await administrativosService.getCargos();
		} catch (error: any) {
			console.error('Error cargando cargos:', error);
		} finally {
			cargandoCargos = false;
		}
	}

	// Validación en tiempo real para campos específicos
	function validarCampo(campo: string, valor: any) {
		switch (campo) {
			case 'ci':
				if (!valor || valor.trim() === '') {
					formErrors.ci = true;
					errorMessages.ci = 'El CI es obligatorio';
				} else if (valor.trim().length < 7) {
					formErrors.ci = true;
					errorMessages.ci = 'El CI debe tener al menos 7 caracteres';
				} else {
					formErrors.ci = false;
					errorMessages.ci = '';
				}
				break;
			case 'nombres':
				if (!valor || valor.trim() === '') {
					formErrors.nombres = true;
					errorMessages.nombres = 'Los nombres son obligatorios';
				} else if (valor.trim().length < 2) {
					formErrors.nombres = true;
					errorMessages.nombres = 'Los nombres deben tener al menos 2 caracteres';
				} else {
					formErrors.nombres = false;
					errorMessages.nombres = '';
				}
				break;
			case 'apellido_paterno':
				if (!valor || valor.trim() === '') {
					formErrors.apellido_paterno = true;
					errorMessages.apellido_paterno = 'El apellido paterno es obligatorio';
				} else if (valor.trim().length < 2) {
					formErrors.apellido_paterno = true;
					errorMessages.apellido_paterno = 'El apellido paterno debe tener al menos 2 caracteres';
				} else {
					formErrors.apellido_paterno = false;
					errorMessages.apellido_paterno = '';
				}
				break;
			case 'correo':
				if (valor && valor.trim() !== '') {
					const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
					if (!emailRegex.test(valor.trim())) {
						formErrors.correo = true;
						errorMessages.correo = 'El correo electrónico no es válido';
					} else {
						formErrors.correo = false;
						errorMessages.correo = '';
					}
				} else {
					formErrors.correo = false;
					errorMessages.correo = '';
				}
				break;
			case 'id_cargo':
				if (!valor) {
					formErrors.id_cargo = true;
					errorMessages.id_cargo = 'Debe seleccionar un cargo';
				} else {
					formErrors.id_cargo = false;
					errorMessages.id_cargo = '';
				}
				break;
			case 'horario_entrada':
			case 'horario_salida':
				if (administrativoData.horario_entrada && administrativoData.horario_salida) {
					const entrada = administrativoData.horario_entrada.split(':').map(Number);
					const salida = administrativoData.horario_salida.split(':').map(Number);
					const minutosEntrada = entrada[0] * 60 + entrada[1];
					const minutosSalida = salida[0] * 60 + salida[1];
					if (minutosSalida <= minutosEntrada) {
						formErrors.horario_salida = true;
						errorMessages.horario_salida = 'El horario de salida debe ser posterior al de entrada';
					} else {
						formErrors.horario_salida = false;
						errorMessages.horario_salida = '';
					}
				}
				break;
		}
	}

	function validarForm() {
		let isValid = true;
		// Resetear errores
		formErrors = {
			ci: false,
			nombres: false,
			apellido_paterno: false,
			correo: false,
			telefono: false,
			direccion: false,
			id_cargo: false,
			años_experiencia: false,
			fecha_ingreso: false,
			area_trabajo: false,
			horario_entrada: false,
			horario_salida: false
		};
		errorMessages = {
			ci: '',
			nombres: '',
			apellido_paterno: '',
			correo: '',
			telefono: '',
			direccion: '',
			id_cargo: '',
			años_experiencia: '',
			fecha_ingreso: '',
			area_trabajo: '',
			horario_entrada: '',
			horario_salida: ''
		};

		// Validar CI
		if (!administrativoData.ci || administrativoData.ci.trim() === '') {
			formErrors.ci = true;
			errorMessages.ci = 'El CI es obligatorio';
			isValid = false;
		}

		// Validar Nombres
		if (!administrativoData.nombres || administrativoData.nombres.trim() === '') {
			formErrors.nombres = true;
			errorMessages.nombres = 'Los nombres son obligatorios';
			isValid = false;
		}

		// Validar Apellido Paterno
		if (!administrativoData.apellido_paterno || administrativoData.apellido_paterno.trim() === '') {
			formErrors.apellido_paterno = true;
			errorMessages.apellido_paterno = 'El apellido paterno es obligatorio';
			isValid = false;
		}

		// Validar Correo
		if (administrativoData.correo && !administrativoData.correo.includes('@')) {
			formErrors.correo = true;
			errorMessages.correo = 'El correo electrónico no es válido';
			isValid = false;
		}

		// Validar Cargo
		if (!administrativoData.id_cargo) {
			formErrors.id_cargo = true;
			errorMessages.id_cargo = 'Debe seleccionar un cargo';
			isValid = false;
		}

		// Validar Horario de Salida debe ser después de entrada
		if (administrativoData.horario_entrada && administrativoData.horario_salida) {
			const entrada = administrativoData.horario_entrada.split(':').map(Number);
			const salida = administrativoData.horario_salida.split(':').map(Number);
			const minutosEntrada = entrada[0] * 60 + entrada[1];
			const minutosSalida = salida[0] * 60 + salida[1];
			if (minutosSalida <= minutosEntrada) {
				formErrors.horario_salida = true;
				errorMessages.horario_salida = 'El horario de salida debe ser posterior al de entrada';
				isValid = false;
			}
		}

		return isValid;
	}

	function convertirHora(hora: string): string {
		// Convertir formato HH:MM a HH:MM:SS
		if (hora && hora.length === 5 && hora.includes(':')) {
			return hora + ':00';
		}
		return hora || '08:00:00';
	}

	async function guardar() {
		if (!administrativo) {
			toastMessage = 'No se encontró el administrativo a editar';
			toastType = 'error';
			return;
		}
		
		if (!validarForm()) {
			// Mostrar toast de error de validación
			toastMessage = 'Por favor, complete todos los campos requeridos correctamente';
			toastType = 'error';
			return;
		}

		guardando = true;

		try {
			const id_persona = administrativo.id_persona || administrativo.id;
			const administrativoUpdate = {
				ci: administrativoData.ci.trim(),
				nombres: administrativoData.nombres.trim(),
				apellido_paterno: administrativoData.apellido_paterno.trim(),
				apellido_materno: administrativoData.apellido_materno?.trim() || null,
				direccion: administrativoData.direccion.trim() || null,
				telefono: administrativoData.telefono.trim() || null,
				correo: administrativoData.correo.trim() || null,
				id_cargo: Number(administrativoData.id_cargo),
				estado_laboral: administrativoData.estado_laboral || 'activo',
				años_experiencia: Number(administrativoData.años_experiencia) || 0,
				fecha_ingreso: administrativoData.fecha_ingreso || null,
				horario_entrada: convertirHora(administrativoData.horario_entrada),
				horario_salida: convertirHora(administrativoData.horario_salida),
				area_trabajo: administrativoData.area_trabajo.trim() || null,
				observaciones: administrativoData.observaciones?.trim() || null
			};

			const saved = await administrativosService.updateAdministrativo(id_persona, administrativoUpdate);
			toastMessage = 'Administrativo actualizado exitosamente';
			toastType = 'success';
			setTimeout(() => {
				dispatch('save', saved);
			}, 1000);
		} catch (error: any) {
			console.error('Error:', error);
			// Extraer mensaje de error del backend
			let errorMsg = 'Error al actualizar administrativo';
			if (error.details?.detail) {
				errorMsg = error.details.detail;
			} else if (error.details?.message) {
				errorMsg = error.details.message;
			} else if (error.message) {
				errorMsg = error.message;
			}
			toastMessage = errorMsg;
			toastType = 'error';
		} finally {
			guardando = false;
		}
	}

	async function eliminarAdministrativo() {
		if (!administrativo) return;

		const id_persona = administrativo.id_persona || administrativo.id;
		if (!id_persona) return;

		if (!confirm('¿Está seguro de eliminar este administrativo? Esta acción no se puede deshacer.')) {
			return;
		}

		eliminando = true;
		try {
			await administrativosService.deleteAdministrativo(id_persona);
			toastMessage = 'Administrativo eliminado exitosamente';
			toastType = 'success';
			setTimeout(() => {
				dispatch('delete', { id: id_persona });
			}, 1000);
		} catch (error: any) {
			console.error('Error:', error);
			// Extraer mensaje de error del backend
			let errorMsg = 'Error al eliminar administrativo';
			if (error.details?.detail) {
				errorMsg = error.details.detail;
			} else if (error.details?.message) {
				errorMsg = error.details.message;
			} else if (error.message) {
				errorMsg = error.message;
			}
			toastMessage = errorMsg;
			toastType = 'error';
		} finally {
			eliminando = false;
		}
	}

	function cancelar() {
		dispatch('cancel');
	}
</script>

<div class="nuevo-administrativo-container">
	<div class="nuevo-administrativo">
		<div class="header">
			<div class="icon-title">
				<div class="icon">👤</div>
				<div>
					<h2>Editar Administrativo</h2>
					<p>Modifique los datos del administrativo</p>
				</div>
			</div>
			<div class="actions">
				{#if administrativo && (administrativo.id_persona || administrativo.id)}
					<button
						class="btn-delete"
						on:click={eliminarAdministrativo}
						disabled={eliminando || guardando}
					>
						{#if eliminando}
							<span class="spinner"></span> Eliminando...
						{:else}
							🗑️ Eliminar
						{/if}
					</button>
				{/if}
				<button class="btn-outline" on:click={cancelar} disabled={guardando || eliminando}>
					Cancelar
				</button>
				<button
					class="btn-primary"
					on:click={guardar}
					disabled={guardando || eliminando || cargandoCargos}
				>
					{#if guardando}
						<span class="spinner"></span> Guardando...
					{:else}
						Actualizar
					{/if}
				</button>
			</div>
		</div>

		<div class="form">
			<!-- Información Personal -->
			<section>
				<h3>Información Personal</h3>
				<div class="form-row single">
					<div class="form-group">
						<label class:error={formErrors.ci}>CI *</label>
						<input
							type="text"
							bind:value={administrativoData.ci}
							on:input={() => validarCampo('ci', administrativoData.ci)}
							on:blur={() => validarCampo('ci', administrativoData.ci)}
							placeholder="Ej: 1234567"
							class:error={formErrors.ci}
							disabled={guardando}
						/>
						{#if formErrors.ci}
							<span class="error-message">{errorMessages.ci}</span>
						{/if}
					</div>
					<div class="form-group">
						<label>Estado Laboral</label>
						<select bind:value={administrativoData.estado_laboral} disabled={guardando}>
							<option value="activo">Activo</option>
							<option value="inactivo">Inactivo</option>
							<option value="retirado">Retirado</option>
							<option value="suspendido">Suspendido</option>
						</select>
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label class:error={formErrors.nombres}>Nombres *</label>
						<input
							type="text"
							bind:value={administrativoData.nombres}
							on:input={() => validarCampo('nombres', administrativoData.nombres)}
							on:blur={() => validarCampo('nombres', administrativoData.nombres)}
							placeholder="Ej: Juan Carlos"
							class:error={formErrors.nombres}
							disabled={guardando}
						/>
						{#if formErrors.nombres}
							<span class="error-message">{errorMessages.nombres}</span>
						{/if}
					</div>
				</div>

				<div class="form-row single">
					<div class="form-group">
						<label class:error={formErrors.apellido_paterno}>Apellido Paterno *</label>
						<input
							type="text"
							bind:value={administrativoData.apellido_paterno}
							on:input={() => validarCampo('apellido_paterno', administrativoData.apellido_paterno)}
							on:blur={() => validarCampo('apellido_paterno', administrativoData.apellido_paterno)}
							placeholder="Ej: Pérez"
							class:error={formErrors.apellido_paterno}
							disabled={guardando}
						/>
						{#if formErrors.apellido_paterno}
							<span class="error-message">{errorMessages.apellido_paterno}</span>
						{/if}
					</div>
					<div class="form-group">
						<label>Apellido Materno</label>
						<input
							type="text"
							bind:value={administrativoData.apellido_materno}
							placeholder="Ej: García"
							disabled={guardando}
						/>
					</div>
				</div>
			</section>

			<!-- Información de Contacto -->
			<section>
				<h3>Información de Contacto</h3>
				<div class="form-row single">
					<div class="form-group">
						<label class:error={formErrors.correo}>Correo Electrónico</label>
						<input
							type="email"
							bind:value={administrativoData.correo}
							on:input={() => validarCampo('correo', administrativoData.correo)}
							on:blur={() => validarCampo('correo', administrativoData.correo)}
							placeholder="administrativo@escuela.edu"
							class:error={formErrors.correo}
							disabled={guardando}
						/>
						{#if formErrors.correo}
							<span class="error-message">{errorMessages.correo}</span>
						{/if}
					</div>
					<div class="form-group">
						<label>Teléfono</label>
						<input
							type="tel"
							bind:value={administrativoData.telefono}
							placeholder="+591 789-0000"
							disabled={guardando}
						/>
					</div>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label>Dirección</label>
						<input
							type="text"
							bind:value={administrativoData.direccion}
							placeholder="Av. Principal #123"
							disabled={guardando}
						/>
					</div>
				</div>
			</section>

			<!-- Información Laboral -->
			<section>
				<h3>Información Laboral</h3>
				<div class="form-row single">
					<div class="form-group">
						<label class:error={formErrors.id_cargo}>Cargo *</label>
						<select
							bind:value={administrativoData.id_cargo}
							on:change={() => validarCampo('id_cargo', administrativoData.id_cargo)}
							on:blur={() => validarCampo('id_cargo', administrativoData.id_cargo)}
							class:error={formErrors.id_cargo}
							disabled={guardando || cargandoCargos}
						>
							<option value={null}>Seleccione un cargo</option>
							{#each cargos as cargo}
								<option value={cargo.id_cargo}>{cargo.nombre_cargo}</option>
							{/each}
						</select>
						{#if formErrors.id_cargo}
							<span class="error-message">{errorMessages.id_cargo}</span>
						{/if}
					</div>
					<div class="form-group">
						<label>Años de Experiencia</label>
						<input
							type="number"
							bind:value={administrativoData.años_experiencia}
							placeholder="0"
							min="0"
							disabled={guardando}
						/>
					</div>
				</div>
				<div class="form-row single">
					<div class="form-group">
						<label>Fecha de Ingreso</label>
						<input type="date" bind:value={administrativoData.fecha_ingreso} disabled={guardando} />
					</div>
					<div class="form-group">
						<label>Área de Trabajo</label>
						<input
							type="text"
							bind:value={administrativoData.area_trabajo}
							placeholder="Ej: Dirección General"
							disabled={guardando}
						/>
					</div>
				</div>
				<div class="form-row single">
					<div class="form-group">
						<label class:error={formErrors.horario_entrada}>Horario de Entrada *</label>
						<input
							type="time"
							bind:value={administrativoData.horario_entrada}
							on:change={() => validarCampo('horario_entrada', administrativoData.horario_entrada)}
							on:blur={() => validarCampo('horario_entrada', administrativoData.horario_entrada)}
							class:error={formErrors.horario_entrada}
							disabled={guardando}
						/>
						{#if formErrors.horario_entrada}
							<span class="error-message">{errorMessages.horario_entrada}</span>
						{/if}
					</div>
					<div class="form-group">
						<label class:error={formErrors.horario_salida}>Horario de Salida *</label>
						<input
							type="time"
							bind:value={administrativoData.horario_salida}
							on:change={() => validarCampo('horario_salida', administrativoData.horario_salida)}
							on:blur={() => validarCampo('horario_salida', administrativoData.horario_salida)}
							class:error={formErrors.horario_salida}
							disabled={guardando}
						/>
						{#if formErrors.horario_salida}
							<span class="error-message">{errorMessages.horario_salida}</span>
						{/if}
					</div>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label>Observaciones</label>
						<textarea
							bind:value={administrativoData.observaciones}
							placeholder="Observaciones adicionales..."
							rows="3"
							disabled={guardando}
						></textarea>
					</div>
				</div>
			</section>
		</div>
	</div>
</div>

<Toast message={toastMessage} type={toastType} />

<style>
	/* CONTENEDOR PRINCIPAL CON SCROLL */
	.nuevo-administrativo-container {
		background: #f8fafc;
		padding: 20px;
	}

	.nuevo-administrativo {
		background: #fff;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		max-width: 900px;
		margin: 0 auto;
		min-height: fit-content;
	}
	/* CONTENEDOR DEL FORMULARIO CON SCROLL INTERNO */
	.form {
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding-right: 8px;
	}

	/* Scroll personalizado */
	.form::-webkit-scrollbar {
		width: 6px;
	}

	.form::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 3px;
	}

	.form::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 3px;
	}

	.form::-webkit-scrollbar-thumb:hover {
		background: #94a3b8;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		border-bottom: 1px solid #e2e8f0;
		padding-bottom: 12px;
		position: sticky;
		top: 0;
		background: white;
		z-index: 10;
	}
	.icon-title {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.icon {
		width: 40px;
		height: 40px;
		background: #e6f7fa;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		flex-shrink: 0;
	}
	h2 {
		margin: 0;
		font-size: 1.15rem;
		color: #1e293b;
	}
	h2 + p {
		margin: 2px 0 0;
		color: #64748b;
		font-size: 0.85rem;
	}
	.actions {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.btn-outline,
	.btn-primary {
		padding: 10px 20px;
		border-radius: 8px;
		font-size: 0.9rem;
		cursor: pointer;
		border: none;
		font-weight: 500;
		transition: all 0.2s;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	}

	.btn-outline {
		background: #fff;
		color: #64748b;
		border: 1.5px solid #e2e8f0;
	}

	.btn-outline:hover:not(:disabled) {
		background: #f8fafc;
		border-color: #cbd5e1;
	}

	.btn-outline:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-primary {
		background: #00cfe6;
		color: #fff;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.btn-primary:hover:not(:disabled) {
		background: #00b8d4;
		transform: translateY(-1px);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-delete {
		padding: 10px 20px;
		border-radius: 8px;
		font-size: 0.9rem;
		cursor: pointer;
		border: none;
		font-weight: 500;
		transition: all 0.2s;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		background: #ef4444;
		color: #fff;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.btn-delete:hover:not(:disabled) {
		background: #dc2626;
		transform: translateY(-1px);
	}

	.btn-delete:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	section {
		background: #fafbfc;
		padding: 18px;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
	}

	section h3 {
		margin: 0 0 16px;
		font-size: 0.95rem;
		color: #1e293b;
		font-weight: 600;
	}

	.form-row {
		display: grid;
		gap: 16px;
		margin-bottom: 12px;
	}

	.form-row.single {
		grid-template-columns: 1fr 1fr;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}
	label {
		margin-bottom: 6px;
		font-size: 0.85rem;
		color: #475569;
		font-weight: 500;
	}

	input,
	select,
	textarea {
		padding: 10px 12px;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		font-size: 0.9rem;
		background: #fff;
		color: #1e293b;
		box-sizing: border-box;
	}
	input:disabled,
	select:disabled,
	textarea:disabled {
		background: #f1f5f9;
		color: #94a3b8;
		cursor: not-allowed;
	}
	select option {
		color: #1e293b;
		background: #fff;
		padding: 8px;
	}
	input:focus,
	select:focus,
	textarea:focus {
		outline: none;
		border-color: #00cfe6;
		box-shadow: 0 0 0 3px rgba(0, 207, 230, 0.1);
	}
	input::placeholder,
	textarea::placeholder {
		color: #94a3b8;
	}
	select {
		cursor: pointer;
	}
	textarea {
		resize: vertical;
		min-height: 80px;
	}
	label.error {
		color: #dc2626;
	}
	input.error,
	select.error {
		border-color: #fca5a5;
		background-color: #fef2f2;
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
	}
	input.error:focus,
	select.error:focus {
		border-color: #dc2626;
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
	}
	.error-message {
		color: #dc2626;
		font-size: 0.75rem;
		margin-top: 4px;
		line-height: 1.3;
		display: block;
		font-weight: 400;
	}
	.spinner {
		display: inline-block;
		width: 12px;
		height: 12px;
		border: 2px solid #ffffff40;
		border-top: 2px solid #fff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	/* Responsive */
	@media (max-width: 768px) {
		.nuevo-administrativo-container {
			padding: 8px;
		}

		.nuevo-administrativo {
			padding: 16px;
			border-radius: 8px;
		}

		.form-row.single {
			grid-template-columns: 1fr;
		}

		.header {
			flex-direction: column;
			gap: 12px;
			align-items: stretch;
		}

		.actions {
			justify-content: stretch;
		}

		.btn-outline,
		.btn-primary {
			flex: 1;
		}
	}
</style>

