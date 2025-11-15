// 1. IMPORTAÇÕES
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 2. INICIALIZAÇÃO
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp"});

// 3. FUNÇÃO PRINCIPAL DO AGENTE
async function runAgent(userPrompt) {
  try {
    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    return `Erro: ${error.message}`;
  }
}

// 4. INTERFACE CLI
const userInput = process.argv.slice(2).join(' ');

if (!userInput) {
  console.log('Uso: node agent.js <sua pergunta aqui>');
  process.exit(1);
}

// 5. EXECUÇÃO
runAgent(userInput).then(response => {
  console.log('\n=== RESPOSTA DO AGENTE ===\n');
  console.log(response);
  console.log('\n========================\n');
});
