import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Función auxiliar para esperar unos segundos si la API se satura
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

        const model = 'gemini-3.8-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        let response = null;
        let data = null;
        let attempts = 3; // Intentar hasta 3 veces si da error 429

        for (let i = 0; i < attempts; i++) {
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

            if (response.ok) {
                break; // Éxito, salimos del ciclo
            } else if (response.status === 429 && i < attempts - 1) {
                console.warn(`Límite de peticiones alcanzado (429). Reintentando en ${ (i + 1) * 2 } segundos...`);
                await sleep((i + 1) * 2000); // Espera progresiva (2s, 4s...)
            } else {
                break;
            }
        }

        if (!response || !response.ok) {
            console.error("Error detallado de Gemini:", data);
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
