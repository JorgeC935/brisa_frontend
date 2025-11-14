<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-layout">
	<nav class="main-nav">
		<div class="nav-brand">
			<h1>BRISA</h1>
		</div>
		<div class="nav-links">
			<a href="/" class="nav-link">Inicio</a>
			<a href="/esquelas" class="nav-link">Esquelas</a>
			<a href="/codigos" class="nav-link">Códigos</a>
		</div>
	</nav>
	<main class="main-content">
		{@render children?.()}
	</main>
</div>

<style>
	.app-layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.main-nav {
		background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.nav-brand h1 {
		margin: 0;
		color: #22d3ee;
		font-size: 1.75rem;
		font-weight: 700;
	}

	.nav-links {
		display: flex;
		gap: 1.5rem;
	}

	.nav-link {
		color: #e2e8f0;
		text-decoration: none;
		font-weight: 500;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		transition: all 0.2s;
	}

	.nav-link:hover {
		background: rgba(34, 211, 238, 0.1);
		color: #22d3ee;
	}

	.main-content {
		flex: 1;
	}
</style>
