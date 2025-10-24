<script lang="ts">
    let nombre = "";
    let mensaje = "";

    function enviar() {
        alert(`Mensaje enviado por ${nombre}: ${mensaje}`);
        nombre = "";
        mensaje = "";
    }
</script>

<h1>Contacto</h1>

<form on:submit|preventDefault={enviar}>
    <input type="text" placeholder="Nombre" bind:value={nombre} required />
    <textarea placeholder="Mensaje" bind:value={mensaje} required></textarea>
    <button type="submit">Enviar</button>
</form>

<style>
    form {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: 300px;
        margin: auto;
    }
    input,
    textarea {
        padding: 0.5rem;
        border-radius: 5px;
        border: 1px solid #ccc;
    }
    button {
        padding: 0.5rem;
        border-radius: 5px;
        background: #4facfe;
        color: white;
        border: none;
        cursor: pointer;
    }
    button:hover {
        background: #00f2fe;
    }
</style>
