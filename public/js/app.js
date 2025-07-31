document.addEventListener('DOMContentLoaded', async () => {
    const ollamaClient = new OllamaClient();
    const openaiClient = new OpenAIClient();
    
    const tokenCounter = new TokenCounter();
    
    const promptLibrary = new PromptLibrary(ollamaClient);
    const chatManager = new ChatManager(ollamaClient, openaiClient, tokenCounter, promptLibrary);
    
    try {
        const models = await ollamaClient.fetchModels();
        console.log('Available Ollama models:', models);
        Utils.showToast('Ollama-Verbindung hergestellt', 'success');
    } catch (error) {
        console.warn('Ollama not available:', error);
        Utils.showToast('Ollama nicht verfügbar - nur OpenAI-Modelle verfügbar', 'warning');
    }
    
    const contextLimits = {
        ...ollamaClient.getAllModelContextLimits(),
        ...openaiClient.getAllModelContextLimits()
    };
    tokenCounter.setModelContextLimits(contextLimits);
    
    Utils.showToast('Anwendung initialisiert', 'success');
    
    window.addEventListener('click', (event) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
});
