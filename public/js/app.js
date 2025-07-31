document.addEventListener('DOMContentLoaded', async () => {
    const ollamaClient = new OllamaClient();
    const openaiClient = new OpenAIClient();
    
    const tokenCounter = new TokenCounter();
    
    try {
        const models = await ollamaClient.fetchModels();
        console.log('Available Ollama models:', models);
        
        const contextLimits = {
            ...ollamaClient.getAllModelContextLimits(),
            ...openaiClient.getAllModelContextLimits()
        };
        tokenCounter.setModelContextLimits(contextLimits);
        
        const promptLibrary = new PromptLibrary(ollamaClient);
        
        const chatManager = new ChatManager(ollamaClient, openaiClient, tokenCounter, promptLibrary);
        
        Utils.showToast('Anwendung initialisiert', 'success');
    } catch (error) {
        console.error('Error initializing app:', error);
        Utils.showToast('Fehler bei der Initialisierung. Bitte überprüfen Sie die Verbindung.', 'error');
    }
    
    window.addEventListener('click', (event) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
});
