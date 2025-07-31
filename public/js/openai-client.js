class OpenAIClient {
    constructor() {
        this.apiKey = null;
        this.models = [
            { name: 'gpt-3.5-turbo', context_length: 4096 },
            { name: 'gpt-4', context_length: 8192 },
            { name: 'gpt-4-turbo', context_length: 128000 },
            { name: 'gpt-4o', context_length: 128000 }
        ];
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    async fetchModels() {
        if (!this.apiKey) {
            return [];
        }
        return this.models;
    }

    getModelContextLimit(modelName) {
        const model = this.models.find(m => m.name === modelName);
        return model ? model.context_length : 4096;
    }

    getAllModelContextLimits() {
        const limits = {};
        for (const model of this.models) {
            limits[model.name] = model.context_length;
        }
        return limits;
    }

    async sendMessage(chatId, messages, model, systemPrompt = null) {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        try {
            const payload = {
                messages,
                model,
                systemPrompt
            };

            const response = await fetch('/api/openai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Failed to send message: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error sending OpenAI message:', error);
            throw error;
        }
    }

    async checkConnection() {
        if (!this.apiKey) {
            return false;
        }

        try {
            const response = await fetch('/api/openai/connection/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ apiKey: this.apiKey })
            });
            const data = await response.json();
            return data.connected;
        } catch (error) {
            return false;
        }
    }

    async summarizeConversation(chatId, messages, model) {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        try {
            const summaryPrompt = `Bitte fasse die folgende Konversation in 2-3 Sätzen zusammen. Konzentriere dich auf die wichtigsten Punkte und den Kontext:

${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Zusammenfassung:`;

            const response = await fetch('/api/openai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: summaryPrompt }],
                    model
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to summarize conversation: ${response.status}`);
            }

            const data = await response.json();
            return {
                summary: data.message.content
            };
        } catch (error) {
            console.error('Error summarizing OpenAI conversation:', error);
            throw error;
        }
    }
}
