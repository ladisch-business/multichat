class OllamaClient {
    constructor() {
        this.apiBaseUrl = '/api';
        this.models = [];
        this.modelDetails = {};
    }

    async fetchModels() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/models`);
            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.status}`);
            }
            
            const data = await response.json();
            this.models = data.models || [];
            
            this.modelDetails = {};
            for (const model of this.models) {
                this.modelDetails[model.name] = {
                    contextLength: model.context_length || 4096,
                    parameters: model.parameters || {}
                };
            }
            
            return this.models;
        } catch (error) {
            console.error('Error fetching models:', error);
            throw error;
        }
    }

    getModelContextLimit(modelName) {
        return this.modelDetails[modelName]?.contextLength || 4096;
    }

    getAllModelContextLimits() {
        const limits = {};
        for (const model of this.models) {
            limits[model.name] = model.context_length || 4096;
        }
        return limits;
    }

    async sendMessage(chatId, messages, model, systemPrompt = null) {
        try {
            const payload = {
                messages,
                model
            };
            
            if (systemPrompt) {
                payload.systemPrompt = systemPrompt;
            }
            
            const response = await fetch(`${this.apiBaseUrl}/chat/${chatId}`, {
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
            console.error('Error sending message:', error);
            throw error;
        }
    }

    async summarizeConversation(chatId, messages, model) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/summarize/${chatId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages,
                    model
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to summarize conversation: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error summarizing conversation:', error);
            throw error;
        }
    }

    async getSystemPrompts() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/system-prompts`);
            if (!response.ok) {
                throw new Error(`Failed to fetch system prompts: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching system prompts:', error);
            throw error;
        }
    }

    async createSystemPrompt(prompt) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/system-prompts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(prompt)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to create system prompt: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error creating system prompt:', error);
            throw error;
        }
    }

    async updateSystemPrompt(id, prompt) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/system-prompts/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(prompt)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to update system prompt: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error updating system prompt:', error);
            throw error;
        }
    }

    async deleteSystemPrompt(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/system-prompts/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`Failed to delete system prompt: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error deleting system prompt:', error);
            throw error;
        }
    }

    async getSettings() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/settings`);
            if (!response.ok) {
                throw new Error(`Failed to fetch settings: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching settings:', error);
            throw error;
        }
    }

    async updateSettings(settings) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to update settings: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    }

    async pullModel(modelName) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/models/pull`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ model: modelName })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to pull model: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error pulling model:', error);
            throw error;
        }
    }

    async deleteModel(modelName) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/models/${modelName}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`Failed to delete model: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error deleting model:', error);
            throw error;
        }
    }

    async checkConnection() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/connection/status`);
            const data = await response.json();
            return data.connected;
        } catch (error) {
            return false;
        }
    }
}
