class ModelManager {
    constructor(ollamaClient) {
        this.ollamaClient = ollamaClient;
        
        this.modelManagerBtn = document.getElementById('modelManagerBtn');
        this.modelManagerModal = document.getElementById('modelManagerModal');
        this.modelNameInput = document.getElementById('modelNameInput');
        this.pullModelBtn = document.getElementById('pullModelBtn');
        this.modelList = document.getElementById('modelList');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.modelManagerBtn.addEventListener('click', () => {
            this.openModelManager();
        });
        
        this.pullModelBtn.addEventListener('click', () => {
            this.pullModel();
        });
        
        this.modelNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.pullModel();
            }
        });
        
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('show');
                }
            });
        });
    }
    
    async openModelManager() {
        this.modelManagerModal.classList.add('show');
        await this.loadModelList();
    }
    
    async loadModelList() {
        this.modelList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Modelle werden geladen...</div>';
        
        try {
            const models = await this.ollamaClient.fetchModels();
            this.renderModelList(models);
        } catch (error) {
            this.modelList.innerHTML = '<div class="error">Fehler beim Laden der Modelle</div>';
        }
    }
    
    renderModelList(models) {
        if (models.length === 0) {
            this.modelList.innerHTML = '<div class="empty-state">Keine Modelle installiert</div>';
            return;
        }
        
        this.modelList.innerHTML = models.map(model => `
            <div class="model-item">
                <div class="model-info">
                    <h4>${model.name}</h4>
                    <p>Kontext: ${Math.round(model.context_length / 1024)}k Tokens | Größe: ${this.formatSize(model.size || 0)}</p>
                </div>
                <div class="model-actions">
                    <button class="btn btn-danger btn-sm" onclick="modelManager.deleteModel('${model.name}')">
                        <i class="fas fa-trash"></i> Löschen
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    async pullModel() {
        const modelName = this.modelNameInput.value.trim();
        if (!modelName) {
            Utils.showToast('Bitte geben Sie einen Modellnamen ein', 'warning');
            return;
        }
        
        this.pullModelBtn.disabled = true;
        this.pullModelBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Installiere...';
        
        try {
            await this.ollamaClient.pullModel(modelName);
            Utils.showToast(`Modell ${modelName} erfolgreich installiert`, 'success');
            this.modelNameInput.value = '';
            await this.loadModelList();
            await this.ollamaClient.fetchModels();
        } catch (error) {
            Utils.showToast(`Fehler beim Installieren des Modells: ${error.message}`, 'error');
        } finally {
            this.pullModelBtn.disabled = false;
            this.pullModelBtn.innerHTML = '<i class="fas fa-download"></i> Installieren';
        }
    }
    
    async deleteModel(modelName) {
        if (!confirm(`Möchten Sie das Modell "${modelName}" wirklich löschen?`)) {
            return;
        }
        
        try {
            await this.ollamaClient.deleteModel(modelName);
            Utils.showToast(`Modell ${modelName} erfolgreich gelöscht`, 'success');
            await this.loadModelList();
            await this.ollamaClient.fetchModels();
        } catch (error) {
            Utils.showToast(`Fehler beim Löschen des Modells: ${error.message}`, 'error');
        }
    }
    
    formatSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}
