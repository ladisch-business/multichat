document.addEventListener('DOMContentLoaded', async () => {
    const ollamaClient = new OllamaClient();
    
    const tokenCounter = new TokenCounter();
    
    try {
        const models = await ollamaClient.fetchModels();
        console.log('Available models:', models);
        
        tokenCounter.setModelContextLimits(ollamaClient.getAllModelContextLimits());
        
        const promptLibrary = new PromptLibrary(ollamaClient);
        
        const chatManager = new ChatManager(ollamaClient, tokenCounter, promptLibrary);
        
        window.modelManager = new ModelManager(ollamaClient);
        
        Utils.showToast('Verbindung zu Ollama hergestellt', 'success');
    } catch (error) {
        console.error('Error initializing app:', error);
        Utils.showToast('Fehler bei der Verbindung zu Ollama. Bitte stellen Sie sicher, dass der Ollama-Server läuft.', 'error');
    }
    
    window.addEventListener('click', (event) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
});
