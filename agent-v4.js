// 1. IMPORTAÇÕES
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const readline = require('readline');
const { exec } = require('child_process');
const util = require('util');
const https = require('https');

const execPromise = util.promisify(exec);

// 2. INICIALIZAÇÃO
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// 3. SYSTEM PROMPT
const SYSTEM_PROMPT = `Você é um assistente inteligente com múltiplas capacidades.

FERRAMENTAS DISPONÍVEIS:

1. BASH - Executar comandos no sistema
   Formato: BASH: <comando>
   Exemplo: "liste arquivos" → BASH: ls -la

2. CLIMA - Buscar clima de cidade
   Formato: CLIMA: <nome_cidade>
   Exemplo: "clima em São Paulo" → CLIMA: São Paulo

3. CONVERSA - Resposta normal
   Sem prefixo especial

REGRAS:
- Escolha a ferramenta correta para cada pergunta
- Use apenas UMA ferramenta por resposta
- Seja conciso na explicação

EXEMPLOS:
User: "liste os arquivos"
You: "BASH: ls -la
Listando arquivos."

User: "como está o tempo em Londres?"
You: "CLIMA: Londres
Consultando clima."

User: "olá, como vai?"
You: "Olá! Estou bem, pronto para ajudar."`;

// 4. HISTÓRICO
const conversationHistory = [
  { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
  { role: "model", parts: [{ text: "Entendido. Pronto para usar bash e clima." }] }
];

// 5. FUNÇÃO CLIMA
function getWeather(city) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=pt_br`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.cod === 200) {
            const result = `
🌡️  Temperatura: ${json.main.temp}°C (sensação: ${json.main.feels_like}°C)
☁️  Condição: ${json.weather[0].description}
💨 Vento: ${json.wind.speed} m/s
💧 Umidade: ${json.main.humidity}%
📍 Local: ${json.name}, ${json.sys.country}`;
            resolve(result);
          } else {
            resolve(`Cidade não encontrada: ${city}`);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// 6. FUNÇÃO BASH
async function executeBash(command) {
  try {
    const { stdout, stderr } = await execPromise(command, { timeout: 5000 });
    return stdout.trim() || stderr.trim() || '✓ Executado.';
  } catch (error) {
    return `❌ Erro: ${error.message}`;
  }
}

// 7. PROCESSAR RESPOSTA
async function processResponse(response) {
  // Detecta BASH
  const bashMatch = response.match(/BASH:\s*(.+?)(?:\n|$)/i);
  if (bashMatch) {
    const command = bashMatch[1].trim();
    console.log(`\n[🔧 Bash: ${command}]`);
    const output = await executeBash(command);
    const explanation = response.replace(/BASH:.+/i, '').trim();
    
    conversationHistory.push({
      role: "user",
      parts: [{ text: `[Sistema] Resultado bash: ${output}` }]
    });
    
    return `${explanation}\n\n📋 Resultado:\n${output}`;
  }
  
  // Detecta CLIMA
  const climaMatch = response.match(/CLIMA:\s*(.+?)(?:\n|$)/i);
  if (climaMatch) {
    const city = climaMatch[1].trim();
    console.log(`\n[🌤️  Clima: ${city}]`);
    const output = await getWeather(city);
    const explanation = response.replace(/CLIMA:.+/i, '').trim();
    
    conversationHistory.push({
      role: "user",
      parts: [{ text: `[Sistema] Clima obtido para ${city}` }]
    });
    
    return `${explanation}\n${output}`;
  }
  
  return response;
}

// 8. AGENTE PRINCIPAL
async function runAgent(userPrompt) {
  conversationHistory.push({
    role: "user",
    parts: [{ text: userPrompt }]
  });

  try {
    const chat = model.startChat({
      history: conversationHistory.slice(0, -1)
    });
    
    const result = await chat.sendMessage(userPrompt);
    const response = result.response.text();
    
    const finalResponse = await processResponse(response);
    
    conversationHistory.push({
      role: "model",
      parts: [{ text: response }]
    });
    
    return finalResponse;
  } catch (error) {
    return `❌ Erro: ${error.message}`;
  }
}

// 9. INTERFACE
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function chat() {
  rl.question('\n💬 Você: ', async (input) => {
    if (input.toLowerCase() === 'sair') {
      console.log('\n👋 Encerrando...\n');
      rl.close();
      return;
    }
    
    if (!input.trim()) {
      chat();
      return;
    }
    
    const response = await runAgent(input);
    console.log(`\n🤖 Agente: ${response}`);
    chat();
  });
}

// 10. INICIALIZAÇÃO
console.log('╔════════════════════════════════════════════╗');
console.log('║  AGENTE CLI v4.0 - Multi-Ferramentas      ║');
console.log('╚════════════════════════════════════════════╝\n');
console.log('🔧 Bash | 🌤️  Clima | 💬 Conversa');
console.log('📝 Digite "sair" para encerrar\n');
chat();
