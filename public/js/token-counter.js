class TokenCounter {
    constructor() {
        this.modelContextLimits = {};
        this.warningThreshold = 90; // Default 90%
    }

    setWarningThreshold(threshold) {
        this.warningThreshold = Math.max(50, Math.min(95, threshold));
    }

    setModelContextLimits(limits) {
        this.modelContextLimits = limits;
    }

    getContextLimit(model) {
        return this.modelContextLimits[model] || 4096; // Default to 4096 if unknown
    }

    estimateTokenCount(text, model) {
        if (!text) return 0;
        
        const ratios = {
            default: 4.0, // ~4 chars per token for English
            llama: 3.8,
            mistral: 3.5,
            gemma: 3.7,
            phi: 4.2
        };
        
        let ratio = ratios.default;
        for (const modelType in ratios) {
            if (model.toLowerCase().includes(modelType)) {
                ratio = ratios[modelType];
                break;
            }
        }
        
        const charCount = text.length;
        const whitespaceCount = (text.match(/\s/g) || []).length;
        const specialCharCount = (text.match(/[^\w\s]/g) || []).length;
        
        const adjustedCharCount = charCount - (whitespaceCount * 0.5) + (specialCharCount * 0.5);
        
        return Math.ceil(adjustedCharCount / ratio);
    }

    estimateConversationTokens(messages, model) {
        if (!messages || !messages.length) return 0;
        
        let totalTokens = 10; 
        
        for (const message of messages) {
            totalTokens += 4; 
            
            totalTokens += 2;
            
            totalTokens += this.estimateTokenCount(message.content, model);
        }
        
        return totalTokens;
    }

    checkTokenWarning(currentTokens, model) {
        const limit = this.getContextLimit(model);
        const percentage = (currentTokens / limit) * 100;
        
        if (percentage >= this.warningThreshold) {
            return {
                warning: true,
                percentage: Math.round(percentage),
                currentTokens,
                limit
            };
        }
        
        return {
            warning: false,
            percentage: Math.round(percentage),
            currentTokens,
            limit
        };
    }

    getTokenBarClass(percentage) {
        if (percentage >= this.warningThreshold) {
            return 'danger';
        } else if (percentage >= this.warningThreshold * 0.8) {
            return 'warning';
        }
        return '';
    }
}
