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

// 3. COMANDOS PERIGOSOS (BLACKLIST)
const DANGEROUS_COMMANDS = [
  'rm -rf',
  'rm -r',
  'sudo',
  'chmod 777',
  'mkfs',
  'dd',
  ':(){:|:&};:',  // fork bomb
  '> /dev/sda',
  'wget',
  'curl',
];

// 4. SYSTEM PROMPT
const SYSTEM_PROMPT = `Você é um assistente de terminal inteligente.

REGRAS:
1. Se o usuário pedir para executar algo no sistema:
   - Responda com: COMANDO: <o_comando_bash_aqui>
   - Explique o que fará
   
2. Se for apenas conversa:
   - Responda normalmente, sem prefixo COMANDO:

EXEMPLOS:
User: "liste os arquivos"
You: "COMANDO: ls -la
Vou listar todos os arquivos."

User: "delete tudo"
You: "COMANDO: rm -rf *
⚠️ ATENÇÃO: Este comando apagará TODOS os arquivos permanentemente."`;

// 5. HISTÓRICO
const conversationHistory = [
  { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
  { role: "model", parts: [{ text: "Entendido. Executarei comandos com cuidado." }] }
];

// 6. VERIFICAR SE COMANDO É PERIGOSO
function isDangerous(command) {
  return DANGEROUS_COMMANDS.some(dangerous => 
    command.toLowerCase().includes(dangerous.toLowerCase())
  );
}

// 7. PEDIR CONFIRMAÇÃO
function askConfirmation(command, rl) {
  return new Promise((resolve) => {
    rl.question(`\n⚠️  COMANDO PERIGOSO DETECTADO: ${command}\n❓ Deseja realmente executar? (sim/não): `, (answer) => {
      resolve(answer.toLowerCase() === 'sim' || answer.toLowerCase() === 's');
    });
  });
}

// 8. EXECUTAR COMANDO
async function executeCommand(command, rl) {
  // Verifica se é perigoso
  if (isDangerous(command)) {
    const confirmed = await askConfirmation(command, rl);
    if (!confirmed) {
      return '🚫 Execução cancelada pelo usuário.';
    }
    console.log('✅ Confirmado. Executando...');
  }
  
  try {
    const { stdout, stderr } = await execPromise(command, { timeout: 5000 });
    return stdout.trim() || stderr.trim() || '✓ Comando executado.';
  } catch (error) {
    return `❌ Erro: ${error.message}`;
  }
}

// 9. PROCESSAR RESPOSTA
async function processResponse(response, rl) {
  const match = response.match(/COMANDO:\s*(.+?)(?:\n|$)/i);
  
  if (match) {
    const command = match[1].trim();
    console.log(`\n[🔧 Comando: ${command}]`);
    
    const output = await executeCommand(command, rl);
    const explanation = response.replace(/COMANDO:.+/i, '').trim();
    
    conversationHistory.push({
      role: "user",
      parts: [{ text: `[Sistema] Resultado: ${output}` }]
    });
    
    return `${explanation}\n\n📋 Resultado:\n${output}`;
  }
  
  return response;
}

// 10. AGENTE PRINCIPAL
async function runAgent(userPrompt, rl) {
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
    
    const finalResponse = await processResponse(response, rl);
    
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
      console.log('\n👋 Encerrando agente...\n');
      rl.close();
      return;
    }
    
    if (!input.trim()) {
      chat();
      return;
    }
    
    const response = await runAgent(input, rl);
    console.log(`\n🤖 Agente: ${response}`);
    chat();
  });
}

// 12. INICIALIZAÇÃO
console.log('╔════════════════════════════════════════════╗');
console.log('║  AGENTE CLI v3.1 - Modo Seguro             ║');
console.log('╚════════════════════════════════════════════╝\n');
console.log('🛡️  Comandos perigosos requerem confirmação');
console.log('📝 Digite "sair" para encerrar\n');
chat();
