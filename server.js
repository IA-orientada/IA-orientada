import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

// Configurar el servidor para que lea JSON y sirva la carpeta 'public'
app.use(express.json());
app.use(express.static('public'));

// Esta es la ruta que recibe los mensajes del HTML
app.post('/api/chat', async (req, res) => {
    // El token se extrae del entorno seguro del sistema
    const token = process.env.GITHUB_TOKEN; 
    const { messages } = req.body;

    try {
        const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                messages: messages,
                model: "meta-llama-3.1-8b-instruct",
                temperature: 0.7,
                max_tokens: 800
            })
        });

        if (!response.ok) {
            throw new Error(`Error de la API: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno procesando la solicitud' });
    }
});

app.listen(port, () => {
    console.log(`Servidor web activo en el puerto ${port}`);
});
