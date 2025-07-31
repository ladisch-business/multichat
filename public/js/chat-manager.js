class ChatManager {
    constructor(ollamaClient, tokenCounter, promptLibrary) {
        this.ollamaClient = ollamaClient;
        this.tokenCounter = tokenCounter;
        this.promptLibrary = promptLibrary;
        
        this.chats = [];
        this.maxChatWindows = 5;
        this.chatGrid = document.getElementById('chatGrid');
        
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.tokenThreshold = document.getElementById('tokenThreshold');
        this.maxChatWindowsInput = document.getElementById('maxChatWindows');
        this.saveSettingsBtn = document.getElementById('saveSettings');
        
        this.tokenWarningModal = document.getElementById('tokenWarningModal');
        this.currentTokensEl = document.getElementById('currentTokens');
        this.tokenLimitEl = document.getElementById('tokenLimit');
        this.tokenPercentageEl = document.getElementById('tokenPercentage');
        this.summarizeConversationBtn = document.getElementById('summarizeConversation');
        
        this.activeChatId = null;
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.loadSettings();
        
        this.connectionIndicator = document.getElementById('connectionIndicator');
        this.connectionText = document.getElementById('connectionText');
        this.startConnectionMonitoring();
        
        for (let i = 0; i < this.maxChatWindows; i++) {
            this.createChatWindow();
        }
        
        this.updateChatLayout();
    }
    
    setupEventListeners() {
        this.settingsBtn.addEventListener('click', () => {
            this.openSettingsModal();
        });
        
        this.saveSettingsBtn.addEventListener('click', () => {
            this.saveSettings();
        });
        
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.remove('show');
                });
            });
        });
        
        this.summarizeConversationBtn.addEventListener('click', () => {
            this.summarizeActiveConversation();
        });
        
        document.getElementById('refreshModelsBtn').addEventListener('click', async () => {
            try {
                await this.ollamaClient.fetchModels();
                this.updateModelSelectors();
                Utils.showToast('Modelle aktualisiert', 'success');
            } catch (error) {
                Utils.showToast('Fehler beim Aktualisieren der Modelle', 'error');
            }
        });
    }
    
    async loadSettings() {
        try {
            const settings = await this.ollamaClient.getSettings();
            this.tokenCounter.setWarningThreshold(settings.tokenWarningThreshold || 90);
            this.maxChatWindows = settings.maxChatWindows || 5;
            
            this.tokenThreshold.value = settings.tokenWarningThreshold || 90;
            this.maxChatWindowsInput.value = settings.maxChatWindows || 5;
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    openSettingsModal() {
        this.settingsModal.classList.add('show');
    }
    
    async saveSettings() {
        const tokenWarningThreshold = parseInt(this.tokenThreshold.value, 10);
        const maxChatWindows = parseInt(this.maxChatWindowsInput.value, 10);
        
        if (isNaN(tokenWarningThreshold) || tokenWarningThreshold < 50 || tokenWarningThreshold > 95) {
            Utils.showToast('Token-Warnschwelle muss zwischen 50 und 95 liegen', 'warning');
            return;
        }
        
        if (isNaN(maxChatWindows) || maxChatWindows < 3 || maxChatWindows > 10) {
            Utils.showToast('Maximale Chat-Fenster muss zwischen 3 und 10 liegen', 'warning');
            return;
        }
        
        try {
            await this.ollamaClient.updateSettings({
                tokenWarningThreshold,
                maxChatWindows
            });
            
            this.tokenCounter.setWarningThreshold(tokenWarningThreshold);
            
            if (maxChatWindows > this.maxChatWindows) {
                for (let i = this.maxChatWindows; i < maxChatWindows; i++) {
                    this.createChatWindow();
                }
            } else if (maxChatWindows < this.maxChatWindows) {
                const chatWindows = document.querySelectorAll('.chat-window');
                for (let i = maxChatWindows; i < chatWindows.length; i++) {
                    chatWindows[i].remove();
                }
                this.chats = this.chats.slice(0, maxChatWindows);
            }
            
            this.maxChatWindows = maxChatWindows;
            
            this.updateChatLayout();
            
            Utils.showToast('Einstellungen gespeichert', 'success');
            this.settingsModal.classList.remove('show');
        } catch (error) {
            Utils.showToast('Fehler beim Speichern der Einstellungen', 'error');
        }
    }
    
    createChatWindow() {
        const chatId = Utils.generateId();
        const chat = {
            id: chatId,
            messages: [],
            model: this.ollamaClient.models.length > 0 ? this.ollamaClient.models[0].name : '',
            systemPrompt: null,
            isTyping: false
        };
        
        this.chats.push(chat);
        
        const chatWindow = document.createElement('div');
        chatWindow.className = 'chat-window';
        chatWindow.dataset.chatId = chatId;
        
        chatWindow.innerHTML = `
            <div class="chat-header">
                <div class="chat-title">
                    <h3>Chat ${this.chats.length}</h3>
                </div>
                <div class="chat-controls">
                    <div class="model-selector">
                        <select id="model-${chatId}">
                            <option value="">Modell wählen...</option>
                        </select>
                    </div>
                    <div class="prompt-selector">
                        <select id="prompt-${chatId}">
                            <option value="">System-Prompt wählen...</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="chat-messages" id="messages-${chatId}">
                <div class="empty-chat">
                    <i class="fas fa-comments"></i>
                    <h4>Neuer Chat</h4>
                    <p>Wählen Sie ein Modell und beginnen Sie die Konversation.</p>
                </div>
            </div>
            <div class="chat-input-area">
                <div class="chat-input-container">
                    <textarea class="chat-input" id="input-${chatId}" placeholder="Nachricht eingeben..." rows="1"></textarea>
                    <button class="btn btn-primary send-btn" id="send-${chatId}" disabled>
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
                <div class="token-info">
                    <div class="token-count">
                        <span id="token-count-${chatId}">0</span> / <span id="token-limit-${chatId}">4096</span> Tokens
                    </div>
                    <div class="token-bar">
                        <div class="token-bar-fill" id="token-bar-${chatId}" style="width: 0%"></div>
                    </div>
                </div>
            </div>
        `;
        
        this.chatGrid.appendChild(chatWindow);
        
        this.setupChatWindowEvents(chatId);
        
        this.updateModelSelector(chatId);
        
        this.updatePromptSelector(chatId);
        
        this.updateChatLayout();
        
        return chatId;
    }
    
    setupChatWindowEvents(chatId) {
        const modelSelector = document.getElementById(`model-${chatId}`);
        const promptSelector = document.getElementById(`prompt-${chatId}`);
        const inputEl = document.getElementById(`input-${chatId}`);
        const sendBtn = document.getElementById(`send-${chatId}`);
        const messagesEl = document.getElementById(`messages-${chatId}`);
        
        modelSelector.addEventListener('change', () => {
            const selectedModel = modelSelector.value;
            if (selectedModel) {
                this.setModel(chatId, selectedModel);
            }
        });
        
        promptSelector.addEventListener('change', () => {
            const selectedPromptId = promptSelector.value;
            if (selectedPromptId) {
                const prompt = this.promptLibrary.getPromptById(selectedPromptId);
                this.setSystemPrompt(chatId, prompt ? prompt.prompt : null);
            } else {
                this.setSystemPrompt(chatId, null);
            }
        });
        
        inputEl.addEventListener('input', () => {
            inputEl.style.height = 'auto';
            inputEl.style.height = `${Math.min(120, Math.max(40, inputEl.scrollHeight))}px`;
            
            sendBtn.disabled = !inputEl.value.trim() || !modelSelector.value;
        });
        
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sendBtn.disabled) {
                    sendBtn.click();
                }
            }
        });
        
        sendBtn.addEventListener('click', () => {
            const message = inputEl.value.trim();
            if (message && modelSelector.value) {
                this.sendMessage(chatId, message);
                inputEl.value = '';
                inputEl.style.height = '40px';
                sendBtn.disabled = true;
            }
        });
        
        messagesEl.addEventListener('click', () => {
            this.activeChatId = chatId;
        });
    }
    
    updateModelSelectors() {
        for (const chat of this.chats) {
            this.updateModelSelector(chat.id);
        }
    }
    
    updateModelSelector(chatId) {
        const modelSelector = document.getElementById(`model-${chatId}`);
        const chat = this.getChat(chatId);
        
        if (!modelSelector) return;
        
        const currentModel = modelSelector.value;
        
        modelSelector.innerHTML = '<option value="">Modell wählen...</option>';
        
        for (const model of this.ollamaClient.models) {
            const option = document.createElement('option');
            option.value = model.name;
            option.textContent = `${model.name} (${Math.round(model.context_length / 1024)}k)`;
            modelSelector.appendChild(option);
        }
        
        if (currentModel && this.ollamaClient.models.some(m => m.name === currentModel)) {
            modelSelector.value = currentModel;
        } else if (chat.model && this.ollamaClient.models.some(m => m.name === chat.model)) {
            modelSelector.value = chat.model;
        } else if (this.ollamaClient.models.length > 0) {
            modelSelector.value = this.ollamaClient.models[0].name;
            this.setModel(chatId, this.ollamaClient.models[0].name);
        }
        
        this.updateTokenDisplay(chatId);
    }
    
    updatePromptSelector(chatId) {
        const promptSelector = document.getElementById(`prompt-${chatId}`);
        const chat = this.getChat(chatId);
        
        if (!promptSelector) return;
        
        const currentPromptId = promptSelector.value;
        
        promptSelector.innerHTML = '<option value="">System-Prompt wählen...</option>';
        
        const prompts = this.promptLibrary.getAllPrompts();
        for (const prompt of prompts) {
            const option = document.createElement('option');
            option.value = prompt.id;
            option.textContent = prompt.name;
            promptSelector.appendChild(option);
        }
        
        if (currentPromptId && prompts.some(p => p.id === currentPromptId)) {
            promptSelector.value = currentPromptId;
        }
    }
    
    getChat(chatId) {
        return this.chats.find(chat => chat.id === chatId);
    }
    
    setModel(chatId, model) {
        const chat = this.getChat(chatId);
        if (chat) {
            chat.model = model;
            this.updateTokenDisplay(chatId);
        }
    }
    
    setSystemPrompt(chatId, systemPrompt) {
        const chat = this.getChat(chatId);
        if (chat) {
            chat.systemPrompt = systemPrompt;
            this.updateTokenDisplay(chatId);
        }
    }
    
    updateTokenDisplay(chatId) {
        const chat = this.getChat(chatId);
        if (!chat || !chat.model) return;
        
        const tokenCountEl = document.getElementById(`token-count-${chatId}`);
        const tokenLimitEl = document.getElementById(`token-limit-${chatId}`);
        const tokenBarEl = document.getElementById(`token-bar-${chatId}`);
        
        if (!tokenCountEl || !tokenLimitEl || !tokenBarEl) return;
        
        const messages = [...chat.messages];
        if (chat.systemPrompt) {
            messages.unshift({
                role: 'system',
                content: chat.systemPrompt
            });
        }
        
        const tokenCount = this.tokenCounter.estimateConversationTokens(messages, chat.model);
        const contextLimit = this.tokenCounter.getContextLimit(chat.model);
        const percentage = Math.min(100, Math.round((tokenCount / contextLimit) * 100));
        
        tokenCountEl.textContent = tokenCount.toLocaleString();
        tokenLimitEl.textContent = contextLimit.toLocaleString();
        tokenBarEl.style.width = `${percentage}%`;
        
        tokenBarEl.className = 'token-bar-fill';
        if (percentage >= this.tokenCounter.warningThreshold) {
            tokenBarEl.classList.add('danger');
        } else if (percentage >= this.tokenCounter.warningThreshold * 0.8) {
            tokenBarEl.classList.add('warning');
        }
    }
    
    async sendMessage(chatId, content) {
        const chat = this.getChat(chatId);
        if (!chat || !chat.model) return;
        
        this.activeChatId = chatId;
        
        const userMessage = {
            role: 'user',
            content,
            timestamp: new Date()
        };
        
        chat.messages.push(userMessage);
        this.renderMessage(chatId, userMessage);
        
        const tokenInfo = this.checkTokenLimit(chatId);
        if (tokenInfo.warning) {
            this.showTokenWarning(chatId, tokenInfo);
        }
        
        chat.isTyping = true;
        this.showTypingIndicator(chatId);
        
        try {
            const response = await this.ollamaClient.sendMessage(
                chatId,
                chat.messages,
                chat.model,
                chat.systemPrompt
            );
            
            const assistantMessage = {
                role: 'assistant',
                content: response.message.content,
                timestamp: new Date()
            };
            
            chat.messages.push(assistantMessage);
            this.renderMessage(chatId, assistantMessage);
            
            this.updateTokenDisplay(chatId);
            
            const updatedTokenInfo = this.checkTokenLimit(chatId);
            if (updatedTokenInfo.warning) {
                this.showTokenWarning(chatId, updatedTokenInfo);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            
            const errorMessage = {
                role: 'system',
                content: `Fehler: ${error.message}`,
                timestamp: new Date()
            };
            
            this.renderMessage(chatId, errorMessage);
        } finally {
            chat.isTyping = false;
            this.hideTypingIndicator(chatId);
        }
    }
    
    renderMessage(chatId, message) {
        const messagesEl = document.getElementById(`messages-${chatId}`);
        if (!messagesEl) return;
        
        const emptyChat = messagesEl.querySelector('.empty-chat');
        if (emptyChat) {
            emptyChat.remove();
        }
        
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.role}`;
        
        let formattedContent = message.content;
        if (message.role === 'assistant') {
            formattedContent = Utils.formatMarkdown(Utils.escapeHtml(message.content));
        } else {
            formattedContent = Utils.escapeHtml(message.content).replace(/\n/g, '<br>');
        }
        
        messageEl.innerHTML = `
            <div class="message-content">${formattedContent}</div>
            <div class="message-meta">
                ${Utils.formatTimestamp(message.timestamp || new Date())}
            </div>
        `;
        
        messagesEl.appendChild(messageEl);
        
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    
    showTypingIndicator(chatId) {
        const messagesEl = document.getElementById(`messages-${chatId}`);
        if (!messagesEl) return;
        
        this.hideTypingIndicator(chatId);
        
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = `
            <span>Ollama denkt nach</span>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        messagesEl.appendChild(typingIndicator);
        
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    
    hideTypingIndicator(chatId) {
        const messagesEl = document.getElementById(`messages-${chatId}`);
        if (!messagesEl) return;
        
        const typingIndicator = messagesEl.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    checkTokenLimit(chatId) {
        const chat = this.getChat(chatId);
        if (!chat || !chat.model) {
            return { warning: false, percentage: 0 };
        }
        
        const messages = [...chat.messages];
        if (chat.systemPrompt) {
            messages.unshift({
                role: 'system',
                content: chat.systemPrompt
            });
        }
        
        const tokenCount = this.tokenCounter.estimateConversationTokens(messages, chat.model);
        return this.tokenCounter.checkTokenWarning(tokenCount, chat.model);
    }
    
    showTokenWarning(chatId, tokenInfo) {
        if (chatId !== this.activeChatId) return;
        
        this.currentTokensEl.textContent = tokenInfo.currentTokens.toLocaleString();
        this.tokenLimitEl.textContent = tokenInfo.limit.toLocaleString();
        this.tokenPercentageEl.textContent = tokenInfo.percentage;
        
        this.tokenWarningModal.classList.add('show');
    }
    
    async summarizeActiveConversation() {
        if (!this.activeChatId) return;
        
        const chat = this.getChat(this.activeChatId);
        if (!chat || chat.messages.length < 2) {
            Utils.showToast('Nicht genügend Nachrichten zum Zusammenfassen', 'warning');
            return;
        }
        
        this.tokenWarningModal.classList.remove('show');
        
        try {
            const summaryRequestMessage = {
                role: 'system',
                content: 'Konversation wird zusammengefasst...',
                timestamp: new Date()
            };
            this.renderMessage(this.activeChatId, summaryRequestMessage);
            
            const response = await this.ollamaClient.summarizeConversation(
                this.activeChatId,
                chat.messages,
                chat.model
            );
            
            const archivedChat = { ...chat };
            
            chat.messages = [];
            
            const summaryMessage = {
                role: 'system',
                content: `Zusammenfassung der vorherigen Konversation: ${response.summary}`,
                timestamp: new Date()
            };
            
            chat.messages.push(summaryMessage);
            
            const messagesEl = document.getElementById(`messages-${this.activeChatId}`);
            if (messagesEl) {
                messagesEl.innerHTML = '';
                this.renderMessage(this.activeChatId, summaryMessage);
            }
            
            this.updateTokenDisplay(this.activeChatId);
            
            Utils.showToast('Konversation zusammengefasst', 'success');
        } catch (error) {
            console.error('Error summarizing conversation:', error);
            Utils.showToast('Fehler beim Zusammenfassen der Konversation', 'error');
        }
    }
    
    startConnectionMonitoring() {
        this.checkConnection();
        setInterval(() => this.checkConnection(), 10000);
    }
    
    async checkConnection() {
        this.connectionIndicator.className = 'connection-led checking';
        this.connectionText.textContent = 'Verbindung prüfen...';
        
        try {
            const isConnected = await this.ollamaClient.checkConnection();
            if (isConnected) {
                this.connectionIndicator.className = 'connection-led connected';
                this.connectionText.textContent = 'Ollama verbunden';
            } else {
                this.connectionIndicator.className = 'connection-led';
                this.connectionText.textContent = 'Ollama getrennt';
            }
        } catch (error) {
            this.connectionIndicator.className = 'connection-led';
            this.connectionText.textContent = 'Verbindungsfehler';
        }
    }
    
    updateChatLayout() {
        const chatCount = this.chats.length;
        this.chatGrid.setAttribute('data-chat-count', chatCount.toString());
    }
}
