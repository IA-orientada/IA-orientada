import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.post('/api/chat', async (req, res) => {
    // Ahora leemos la clave de Gemini
    const apiKey = process.env.GEMINI_API_KEY; 
    const { messages } = req.body;

    // Convertimos el formato de mensajes al que pide Gemini
    const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    // Extraemos el system prompt si existe
    const systemPrompt = messages.find(m => m.role === 'system')?.content || "";

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: { text: systemPrompt } },
                contents: contents
            })
        });

        if (!response.ok) {
            throw new Error(`Error de la API de Gemini: ${response.status}`);
        }

        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;

        // Devolvemos la respuesta simulando la estructura que esperaba el HTML
        res.json({
            choices: [{
                message: { content: aiText }
            }]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error procesando la solicitud con Gemini' });
    }
});

app.listen(port, () => {
    console.log(`Servidor web activo en el puerto ${port}`);
});
