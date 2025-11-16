// 1. IMPORTAÇÕES
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
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
