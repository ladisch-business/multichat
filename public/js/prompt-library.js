class PromptLibrary {
    constructor(ollamaClient) {
        this.ollamaClient = ollamaClient;
        this.prompts = [];
        this.currentPromptId = null;
        
        this.promptLibraryBtn = document.getElementById('promptLibraryBtn');
        this.promptLibraryModal = document.getElementById('promptLibraryModal');
        this.promptList = document.getElementById('promptList');
        this.addPromptBtn = document.getElementById('addPromptBtn');
        
        this.promptEditorModal = document.getElementById('promptEditorModal');
        this.promptEditorTitle = document.getElementById('promptEditorTitle');
        this.promptName = document.getElementById('promptName');
        this.promptCategory = document.getElementById('promptCategory');
        this.promptContent = document.getElementById('promptContent');
        this.savePromptBtn = document.getElementById('savePrompt');
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.loadPrompts();
    }
    
    setupEventListeners() {
        this.promptLibraryBtn.addEventListener('click', () => {
            this.openPromptLibrary();
        });
        
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.remove('show');
                });
            });
        });
        
        this.addPromptBtn.addEventListener('click', () => {
            this.openPromptEditor();
        });
        
        this.savePromptBtn.addEventListener('click', () => {
            this.savePrompt();
        });
    }
    
    async loadPrompts() {
        try {
            this.prompts = await this.ollamaClient.getSystemPrompts();
            this.renderPromptList();
        } catch (error) {
            Utils.showToast('Fehler beim Laden der System-Prompts', 'error');
        }
    }
    
    renderPromptList() {
        this.promptList.innerHTML = '';
        
        if (this.prompts.length === 0) {
            this.promptList.innerHTML = `
                <div class="empty-state">
                    <p>Keine System-Prompts vorhanden. Erstellen Sie einen neuen Prompt mit dem "+" Button.</p>
                </div>
            `;
            return;
        }
        
        const promptsByCategory = {};
        for (const prompt of this.prompts) {
            const category = prompt.category || 'Allgemein';
            if (!promptsByCategory[category]) {
                promptsByCategory[category] = [];
            }
            promptsByCategory[category].push(prompt);
        }
        
        for (const category in promptsByCategory) {
            const categoryEl = document.createElement('div');
            categoryEl.className = 'prompt-category';
            categoryEl.innerHTML = `<h3>${category}</h3>`;
            this.promptList.appendChild(categoryEl);
            
            for (const prompt of promptsByCategory[category]) {
                const promptEl = document.createElement('div');
                promptEl.className = 'prompt-item';
                promptEl.innerHTML = `
                    <div class="prompt-item-header">
                        <div>
                            <div class="prompt-item-title">${prompt.name}</div>
                            <span class="prompt-item-category">${prompt.category || 'Allgemein'}</span>
                        </div>
                        <div class="prompt-item-actions">
                            <button class="btn btn-sm edit-prompt" data-id="${prompt.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-prompt" data-id="${prompt.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="prompt-item-content">${prompt.prompt}</div>
                `;
                this.promptList.appendChild(promptEl);
                
                promptEl.querySelector('.edit-prompt').addEventListener('click', () => {
                    this.openPromptEditor(prompt);
                });
                
                promptEl.querySelector('.delete-prompt').addEventListener('click', () => {
                    this.deletePrompt(prompt.id);
                });
            }
        }
    }
    
    openPromptLibrary() {
        this.promptLibraryModal.classList.add('show');
    }
    
    openPromptEditor(prompt = null) {
        this.currentPromptId = prompt ? prompt.id : null;
        this.promptEditorTitle.textContent = prompt ? 'Prompt bearbeiten' : 'Neuer Prompt';
        this.promptName.value = prompt ? prompt.name : '';
        this.promptCategory.value = prompt ? prompt.category : '';
        this.promptContent.value = prompt ? prompt.prompt : '';
        
        this.promptLibraryModal.classList.remove('show');
        this.promptEditorModal.classList.add('show');
    }
    
    async savePrompt() {
        const name = this.promptName.value.trim();
        const category = this.promptCategory.value.trim();
        const prompt = this.promptContent.value.trim();
        
        if (!name || !prompt) {
            Utils.showToast('Name und Prompt-Inhalt sind erforderlich', 'warning');
            return;
        }
        
        try {
            if (this.currentPromptId) {
                await this.ollamaClient.updateSystemPrompt(this.currentPromptId, {
                    name,
                    category,
                    prompt
                });
                Utils.showToast('Prompt aktualisiert', 'success');
            } else {
                await this.ollamaClient.createSystemPrompt({
                    name,
                    category,
                    prompt
                });
                Utils.showToast('Neuer Prompt erstellt', 'success');
            }
            
            await this.loadPrompts();
            this.promptEditorModal.classList.remove('show');
            this.promptLibraryModal.classList.add('show');
        } catch (error) {
            Utils.showToast('Fehler beim Speichern des Prompts', 'error');
        }
    }
    
    async deletePrompt(id) {
        if (!confirm('Sind Sie sicher, dass Sie diesen Prompt löschen möchten?')) {
            return;
        }
        
        try {
            await this.ollamaClient.deleteSystemPrompt(id);
            Utils.showToast('Prompt gelöscht', 'success');
            await this.loadPrompts();
        } catch (error) {
            Utils.showToast('Fehler beim Löschen des Prompts', 'error');
        }
    }
    
    getPromptById(id) {
        return this.prompts.find(p => p.id === id);
    }
    
    getAllPrompts() {
        return this.prompts;
    }
}
