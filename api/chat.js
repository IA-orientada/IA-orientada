export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método no permitido');

    // El token se leerá de las variables secretas del servidor, no del código
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

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error al conectar con la IA' });
    }
}
