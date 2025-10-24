<script lang="ts">
    // Por ahora no necesitamos lógica
</script>

<div class="landing">
    <h1>Bienvenido a BRISA Frontend</h1>
    <p>Este es un ejemplo de landing page estática para la app institucional</p>
    <a href="#" class="btn">Comenzar</a>
</div>

<style>
    .landing {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        font-family: sans-serif;
        background: linear-gradient(to right, #4facfe, #00f2fe);
        color: white;
        text-align: center;
        padding: 1rem;
    }

    h1 {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    p {
        font-size: 1.2rem;
        margin-bottom: 2rem;
    }

    .btn {
        background: white;
        color: #4facfe;
        padding: 0.8rem 1.5rem;
        border-radius: 8px;
        text-decoration: none;
        font-weight: bold;
        transition: 0.3s;
    }

    .btn:hover {
        background: #f0f0f0;
        color: #0077cc;
    }
</style>
