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
const SYSTEM_PROMPT = `Você é um assistente inteligente com 5 capacidades:

FERRAMENTAS DISPONÍVEIS:

1. BASH - Executar comandos no sistema
   Formato: BASH: <comando>
   Exemplo: "liste arquivos" → BASH: ls -la

2. CLIMA - Consultar clima de cidade
   Formato: CLIMA: <cidade>
   Exemplo: "clima em Paris" → CLIMA: Paris

3. BUSCA - Buscar na web
   Formato: BUSCA: <query>
   Exemplo: "últimas notícias sobre IA" → BUSCA: notícias IA 2024

4. MOEDA - Converter moedas
   Formato: MOEDA: <valor> <origem> <destino>
   Exemplo: "100 dólares em reais" → MOEDA: 100 USD BRL

5. CONVERSA - Resposta normal
   Sem prefixo especial

REGRAS:
- Escolha UMA ferramenta por resposta
- Seja preciso e conciso
- Explique brevemente o que fará

EXEMPLOS:
User: "liste arquivos"
You: "BASH: ls -la
Listando arquivos."

User: "clima em Londres"
You: "CLIMA: Londres
Consultando clima."

User: "busque informações sobre GPT-4"
You: "BUSCA: GPT-4
Buscando na web."

User: "quanto é 50 euros em dólares?"
You: "MOEDA: 50 EUR USD
Convertendo."

User: "olá"
You: "Olá! Como posso ajudar?"`;

// 4. HISTÓRICO
const conversationHistory = [
  { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
  { role: "model", parts: [{ text: "Entendido. 5 ferramentas prontas: bash, clima, busca, moeda, conversa." }] }
];

// 5. FUNÇÃO BASH
async function executeBash(command) {
  try {
    const { stdout, stderr } = await execPromise(command, { timeout: 5000 });
    return stdout.trim() || stderr.trim() || '✓ Executado.';
  } catch (error) {
    return `❌ Erro: ${error.message}`;
  }
}

// 6. FUNÇÃO CLIMA
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
            const result = `🌡️  ${json.main.temp}°C (sensação: ${json.main.feels_like}°C)
☁️  ${json.weather[0].description}
💨 Vento: ${json.wind.speed} m/s
💧 Umidade: ${json.main.humidity}%
📍 ${json.name}, ${json.sys.country}`;
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

// 7. FUNÇÃO BUSCA WEB
function webSearch(query) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CX;
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=3`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.items && json.items.length > 0) {
            let results = '🔍 Resultados:\n\n';
            json.items.slice(0, 3).forEach((item, i) => {
              results += `${i + 1}. ${item.title}\n${item.snippet}\n🔗 ${item.link}\n\n`;
            });
            resolve(results);
          } else {
            resolve('Nenhum resultado encontrado.');
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// 8. FUNÇÃO CONVERSÃO MOEDA
function convertCurrency(amount, from, to) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.EXCHANGE_RATE_KEY;
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${from}/${to}/${amount}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.result === 'success') {
            const result = `💱 ${amount} ${from} = ${json.conversion_result.toFixed(2)} ${to}
📊 Taxa: 1 ${from} = ${json.conversion_rate.toFixed(4)} ${to}`;
            resolve(result);
          } else {
            resolve(`Erro na conversão: ${json['error-type']}`);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// 9. PROCESSAR RESPOSTA
async function processResponse(response) {
  // BASH
  const bashMatch = response.match(/BASH:\s*(.+?)(?:\n|$)/i);
  if (bashMatch) {
    const command = bashMatch[1].trim();
    console.log(`\n[🔧 Bash: ${command}]`);
    const output = await executeBash(command);
    const explanation = response.replace(/BASH:.+/i, '').trim();
    
    conversationHistory.push({
      role: "user",
      parts: [{ text: `[Sistema] Bash: ${output.substring(0, 100)}` }]
    });
    
    return `${explanation}\n\n📋 Resultado:\n${output}`;
  }
  
  // CLIMA
  const climaMatch = response.match(/CLIMA:\s*(.+?)(?:\n|$)/i);
  if (climaMatch) {
    const city = climaMatch[1].trim();
    console.log(`\n[🌤️  Clima: ${city}]`);
    const output = await getWeather(city);
    const explanation = response.replace(/CLIMA:.+/i, '').trim();
    
    conversationHistory.push({
      role: "user",
      parts: [{ text: `[Sistema] Clima de ${city} consultado` }]
    });
    
    return `${explanation}\n\n${output}`;
  }
  
  // BUSCA
  const buscaMatch = response.match(/BUSCA:\s*(.+?)(?:\n|$)/i);
  if (buscaMatch) {
    const query = buscaMatch[1].trim();
    console.log(`\n[🔍 Busca: ${query}]`);
    const output = await webSearch(query);
    const explanation = response.replace(/BUSCA:.+/i, '').trim();
    
    conversationHistory.push({
      role: "user",
      parts: [{ text: `[Sistema] Busca web realizada` }]
    });
    
    return `${explanation}\n\n${output}`;
  }
  
  // MOEDA
  const moedaMatch = response.match(/MOEDA:\s*(\d+\.?\d*)\s+([A-Z]{3})\s+([A-Z]{3})/i);
  if (moedaMatch) {
    const amount = parseFloat(moedaMatch[1]);
    const from = moedaMatch[2].toUpperCase();
    const to = moedaMatch[3].toUpperCase();
    console.log(`\n[💱 Moeda: ${amount} ${from} → ${to}]`);
    const output = await convertCurrency(amount, from, to);
    const explanation = response.replace(/MOEDA:.+/i, '').trim();
    
    conversationHistory.push({
      role: "user",
      parts: [{ text: `[Sistema] Conversão realizada` }]
    });
    
    return `${explanation}\n\n${output}`;
  }
  
  return response;
}

// 10. AGENTE PRINCIPAL
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

// 11. INTERFACE
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function chat() {
  rl.question('\n💬 Você: ', async (input) => {
    if (input.toLowerCase() === 'sair') {
      console.log('\n👋 Encerrando agente v5...\n');
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

// 12. INICIALIZAÇÃO
console.log('╔════════════════════════════════════════════╗');
console.log('║     AGENTE CLI v5.0 - VERSÃO FINAL        ║');
console.log('╚════════════════════════════════════════════╝\n');
console.log('🔧 Bash | 🌤️  Clima | 🔍 Busca | 💱 Moeda | 💬 Conversa');
console.log('📝 Digite "sair" para encerrar\n');
chat();
