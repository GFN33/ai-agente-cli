// 1. IMPORTAÇÕES
require('dotenv').config();
// 1. IMPORTAÇÕES
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const readline = require('readline');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// 2. INICIALIZAÇÃO
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// 3. SYSTEM PROMPT
const SYSTEM_PROMPT = `Você é um assistente de terminal inteligente.

REGRAS:
1. Se o usuário pedir para executar algo no sistema (listar arquivos, criar pastas, ver diretório atual, etc):
   - Responda com: COMANDO: <o_comando_bash_aqui>
   - Explique o que fará
   
2. Se for apenas conversa normal:
   - Responda normalmente, sem prefixo COMANDO:

EXEMPLOS:
User: "liste os arquivos"
You: "COMANDO: ls -la
Vou listar todos os arquivos com detalhes."

User: "qual diretório estou?"
You: "COMANDO: pwd
Mostrando o diretório atual."

User: "como vai?"
You: "Estou bem, obrigado! Como posso ajudar?"`;

// 4. HISTÓRICO
const conversationHistory = [
  { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
  { role: "model", parts: [{ text: "Entendido. Pronto para executar comandos bash quando necessário." }] }
];

// 5. EXECUTAR COMANDO
async function executeCommand(command) {
  try {
    const { stdout, stderr } = await execPromise(command, { timeout: 5000 });
    return stdout.trim() || stderr.trim() || 'Comando executado com sucesso.';
  } catch (error) {
    return `Erro: ${error.message}`;
  }
}

// 6. PROCESSAR RESPOSTA
async function processResponse(response) {
  // Detecta padrão: COMANDO: <comando>
  const match = response.match(/COMANDO:\s*(.+?)(?:\n|$)/i);
  
  if (match) {
    const command = match[1].trim();
    console.log(`\n[🔧 Executando: ${command}]`);
    
    const output = await executeCommand(command);
    const explanation = response.replace(/COMANDO:.+/i, '').trim();
    
    // Adiciona contexto do resultado ao histórico
    conversationHistory.push({
      role: "user",
      parts: [{ text: `[Sistema] Resultado do comando '${command}':\n${output}` }]
    });
    
    return `${explanation}\n\n📋 Resultado:\n${output}`;
  }
  
  return response;
}

// 7. AGENTE PRINCIPAL
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
    
    // Processa e possivelmente executa comando
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

// 8. INTERFACE
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function chat() {
  rl.question('\n💬 Você: ', async (input) => {
    if (input.toLowerCase() === 'sair') {
      console.log('\n👋 Encerrando agente...\n');
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

// 9. INICIALIZAÇÃO
console.log('╔════════════════════════════════════════════╗');
console.log('║  AGENTE CLI v3.0 - Executor de Comandos   ║');
console.log('╚════════════════════════════════════════════╝\n');
console.log('⚠️  Este agente pode executar comandos bash');
console.log('📝 Digite "sair" para encerrar\n');
chat();const { GoogleGenerativeAI } = require('@google/generative-ai');
const readline = require('readline');

// 2. INICIALIZAÇÃO
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// 3. HISTÓRICO DE CONVERSA (NOVO)
const conversationHistory = [];

// 4. FUNÇÃO PRINCIPAL DO AGENTE
async function runAgent(userPrompt) {
  // Adiciona mensagem do usuário ao histórico
  conversationHistory.push({
    role: "user",
    parts: [{ text: userPrompt }]
  });

  try {
    // Cria chat com histórico completo
    const chat = model.startChat({
      history: conversationHistory.slice(0, -1), // Todas menos a última
    });
    
    const result = await chat.sendMessage(userPrompt);
    const response = result.response.text();
    
    // Adiciona resposta do assistente ao histórico
    conversationHistory.push({
      role: "model",
      parts: [{ text: response }]
    });
    
    return response;
  } catch (error) {
    return `Erro: ${error.message}`;
  }
}

// 5. INTERFACE INTERATIVA (NOVO)
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function chat() {
  rl.question('\nVocê: ', async (input) => {
    if (input.toLowerCase() === 'sair') {
      console.log('\nEncerrando agente...');
      rl.close();
      return;
    }
    
    if (!input.trim()) {
      chat(); // Se vazio, pergunta de novo
      return;
    }
    
    const response = await runAgent(input);
    console.log(`\nAgente: ${response}`);
    chat(); // Chama novamente = loop infinito
  });
}

// 6. INICIALIZAÇÃO
console.log('=== AGENTE CLI v2.0 - Modo Chat ===');
console.log('Digite "sair" para encerrar\n');
chat();
