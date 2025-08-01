const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://ollama:11434';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const DATA_DIR = path.join(__dirname, 'data');

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function loadSystemPrompts() {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, 'system-prompts.json'), 'utf8');
    return JSON.parse(data);
  } catch {
    const defaultPrompts = [
      {
        id: uuidv4(),
        name: "Standard Assistant",
        prompt: "You are a helpful AI assistant. Provide clear, accurate, and concise responses.",
        category: "General"
      },
      {
        id: uuidv4(),
        name: "Code Expert",
        prompt: "You are an expert software developer. Help with coding questions, debugging, and best practices.",
        category: "Development"
      },
      {
        id: uuidv4(),
        name: "Creative Writer",
        prompt: "You are a creative writing assistant. Help with storytelling, character development, and narrative structure.",
        category: "Creative"
      }
    ];
    await saveSystemPrompts(defaultPrompts);
    return defaultPrompts;
  }
}

async function saveSystemPrompts(prompts) {
  await fs.writeFile(path.join(DATA_DIR, 'system-prompts.json'), JSON.stringify(prompts, null, 2));
}

async function loadSettings() {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, 'settings.json'), 'utf8');
    return JSON.parse(data);
  } catch {
    const defaultSettings = {
      tokenWarningThreshold: 90,
      maxChatWindows: 6,
      theme: 'dark',
      openaiApiKey: ''
    };
    await saveSettings(defaultSettings);
    return defaultSettings;
  }
}

async function saveSettings(settings) {
  await fs.writeFile(path.join(DATA_DIR, 'settings.json'), JSON.stringify(settings, null, 2));
}

async function loadChatStates() {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, 'chat-states.json'), 'utf8');
    return JSON.parse(data);
  } catch {
    const defaultChatStates = {
      chatCount: 2,
      chats: []
    };
    await saveChatStates(defaultChatStates);
    return defaultChatStates;
  }
}

async function saveChatStates(chatStates) {
  await fs.writeFile(path.join(DATA_DIR, 'chat-states.json'), JSON.stringify(chatStates, null, 2));
}

app.get('/api/models', async (req, res) => {
  try {
    const tagsResponse = await axios.get(`${OLLAMA_API_URL}/api/tags`);
    const models = [];
    
    for (const model of tagsResponse.data.models) {
      try {
        const showResponse = await axios.post(`${OLLAMA_API_URL}/api/show`, {
          name: model.name
        });
        
        models.push({
          name: model.name,
          size: model.size,
          modified_at: model.modified_at,
          context_length: showResponse.data.model_info?.['llama.context_length'] || 4096,
          parameters: showResponse.data.parameters || {}
        });
      } catch (error) {
        models.push({
          name: model.name,
          size: model.size,
          modified_at: model.modified_at,
          context_length: 4096,
          parameters: {}
        });
      }
    }
    
    res.json({ models });
  } catch (error) {
    console.error('Error fetching models:', error.message);
    res.status(500).json({ error: 'Failed to fetch models from Ollama' });
  }
});

app.post('/api/chat/:chatId', async (req, res) => {
  const { chatId } = req.params;
  const { messages, model, systemPrompt } = req.body;
  
  try {
    const chatMessages = [...messages];
    if (systemPrompt) {
      chatMessages.unshift({
        role: 'system',
        content: systemPrompt
      });
    }
    
    const response = await axios.post(`${OLLAMA_API_URL}/api/chat`, {
      model,
      messages: chatMessages,
      stream: false
    }, {
      timeout: 120000
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error in chat:', error.message);
    console.error('Error details:', {
      code: error.code,
      response: error.response?.status,
      timeout: error.code === 'ECONNABORTED'
    });
    
    if (error.code === 'ECONNABORTED') {
      res.status(504).json({ error: 'Request timeout - model is loading, please try again' });
    } else {
      res.status(500).json({ error: 'Failed to get response from Ollama' });
    }
  }
});

app.post('/api/summarize/:chatId', async (req, res) => {
  const { chatId } = req.params;
  const { messages, model } = req.body;
  
  try {
    const summaryPrompt = `Please provide a concise summary of this conversation that captures the key points, context, and any important decisions or conclusions. This summary will be used to continue the conversation in a new chat window.

Conversation to summarize:
${messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')}

Summary:`;
    
    const response = await axios.post(`${OLLAMA_API_URL}/api/chat`, {
      model,
      messages: [
        {
          role: 'user',
          content: summaryPrompt
        }
      ],
      stream: false
    }, {
      timeout: 120000
    });
    
    res.json({ summary: response.data.message.content });
  } catch (error) {
    console.error('Error in summarization:', error.message);
    console.error('Error details:', {
      code: error.code,
      response: error.response?.status,
      timeout: error.code === 'ECONNABORTED'
    });
    
    if (error.code === 'ECONNABORTED') {
      res.status(504).json({ error: 'Request timeout - model is loading, please try again' });
    } else {
      res.status(500).json({ error: 'Failed to summarize conversation' });
    }
  }
});

app.get('/api/system-prompts', async (req, res) => {
  try {
    const prompts = await loadSystemPrompts();
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load system prompts' });
  }
});

app.post('/api/system-prompts', async (req, res) => {
  try {
    const prompts = await loadSystemPrompts();
    const newPrompt = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    prompts.push(newPrompt);
    await saveSystemPrompts(prompts);
    res.json(newPrompt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create system prompt' });
  }
});

app.put('/api/system-prompts/:id', async (req, res) => {
  try {
    const prompts = await loadSystemPrompts();
    const index = prompts.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'System prompt not found' });
    }
    prompts[index] = { ...prompts[index], ...req.body, updatedAt: new Date().toISOString() };
    await saveSystemPrompts(prompts);
    res.json(prompts[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update system prompt' });
  }
});

app.delete('/api/system-prompts/:id', async (req, res) => {
  try {
    const prompts = await loadSystemPrompts();
    const filteredPrompts = prompts.filter(p => p.id !== req.params.id);
    await saveSystemPrompts(filteredPrompts);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete system prompt' });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await loadSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const settings = await loadSettings();
    const updatedSettings = { ...settings, ...req.body };
    await saveSettings(updatedSettings);
    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.get('/api/chat-states', async (req, res) => {
  try {
    const chatStates = await loadChatStates();
    res.json(chatStates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load chat states' });
  }
});

app.put('/api/chat-states', async (req, res) => {
  try {
    await saveChatStates(req.body);
    res.json(req.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save chat states' });
  }
});

app.post('/api/models/pull', async (req, res) => {
  const { model } = req.body;
  try {
    const response = await axios.post(`${OLLAMA_API_URL}/api/pull`, {
      name: model,
      stream: false
    }, {
      timeout: 300000
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error pulling model:', error.message);
    res.status(500).json({ error: 'Failed to pull model from Ollama' });
  }
});

app.delete('/api/models/:modelName', async (req, res) => {
  const { modelName } = req.params;
  try {
    await axios.delete(`${OLLAMA_API_URL}/api/delete`, {
      data: { name: modelName }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting model:', error.message);
    res.status(500).json({ error: 'Failed to delete model from Ollama' });
  }
});

app.get('/api/connection/status', async (req, res) => {
  try {
    await axios.get(`${OLLAMA_API_URL}/api/tags`, { timeout: 5000 });
    res.json({ connected: true });
  } catch (error) {
    res.json({ connected: false });
  }
});

app.post('/api/openai/chat', async (req, res) => {
  const { messages, model, systemPrompt } = req.body;
  
  try {
    const settings = await loadSettings();
    const apiKey = settings.openaiApiKey;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'OpenAI API key not configured' });
    }

    const chatMessages = [...messages];
    if (systemPrompt) {
      chatMessages.unshift({
        role: 'system',
        content: systemPrompt
      });
    }

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model,
      messages: chatMessages,
      max_tokens: 2000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      message: {
        content: response.data.choices[0].message.content
      }
    });
  } catch (error) {
    console.error('Error in OpenAI chat:', error.message);
    res.status(500).json({ error: 'Failed to get response from OpenAI' });
  }
});

app.post('/api/openai/connection/status', async (req, res) => {
  const { apiKey } = req.body;
  
  if (!apiKey) {
    return res.json({ connected: false });
  }

  try {
    await axios.get('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 5000
    });
    res.json({ connected: true });
  } catch (error) {
    res.json({ connected: false });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function startServer() {
  await ensureDataDir();
  app.listen(PORT, () => {
    console.log(`Ollama Power-Interface server running on port ${PORT}`);
    console.log(`Ollama API URL: ${OLLAMA_API_URL}`);
  });
}

startServer().catch(console.error);
