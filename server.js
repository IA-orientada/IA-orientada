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

        // Lista de modelos a intentar en orden de preferencia
        const modelsToTry = ['gemini-3.8-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
        let response = null;
        let data = null;

        for (const model of modelsToTry) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            
            response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: { text: systemInstruction }
                    },
                    contents: chatHistory
                })
            });

            data = await response.json();

            // Si la respuesta es exitosa, rompemos el ciclo y continuamos
            if (response.ok) {
                break;
            } else {
                console.warn(`Modelo ${model} falló con estado ${response.status}. Intentando siguiente...`);
            }
        }

        if (!response || !response.ok) {
            console.error("Error detallado de Gemini (todos los modelos fallaron):", data);
            throw new Error(`Error de la API de Gemini: ${response ? response.status : 'Desconocido'}`);
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
