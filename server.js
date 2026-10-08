import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.post('/api/chat', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY; 
    const { messages } = req.body;

    try {
        const systemMessage = messages.find(m => m.role === 'system');
        const systemInstruction = systemMessage ? systemMessage.content : "Eres un tutor socrático.";

        const chatHistory = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));

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
