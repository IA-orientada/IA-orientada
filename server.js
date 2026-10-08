import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.post('/api/chat', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY; 
    const { messages } = req.body;

    try {
        // 1. Extraemos el mensaje del sistema (prompt socrático) si existe
        const systemMessage = messages.find(m => m.role === 'system');
        const systemInstruction = systemMessage ? systemMessage.content : "Eres un tutor socrático.";

        // 2. Filtramos el historial para mandar solo los mensajes de usuario y modelo
        const chatHistory = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));

        // Usamos gemini-2.5-flash para conectar correctamente con la versión actual de la API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    parts: { text: systemInstruction }
                },
                contents: chatHistory
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Error detallado de Gemini:", data);
            throw new Error(`Error de la API de Gemini: ${response.status}`);
        }

        const aiText = data.candidates[0].content.parts[0].text;

        // Devolvemos la respuesta con la estructura que el frontend espera
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
