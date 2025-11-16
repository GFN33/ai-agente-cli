# 🤖 AI Agent CLI - Agente Multi-Ferramentas

Agente de IA evolutivo para terminal, construído com Node.js e Gemini API. Do básico ao multi-ferramentas em 4 versões progressivas.

## 🎯 Sobre o Projeto

Este projeto demonstra a evolução de um agente de IA simples até um assistente multi-ferramentas completo, capaz de:
- 💬 Manter conversas contextuais
- 🔧 Executar comandos bash no sistema
- 🌤️ Consultar clima em tempo real
- 🛡️ Validar comandos perigosos antes de executar

## 📊 Versões

### v1 - Fundação
**Arquivo:** `agent.js`

Agente básico de pergunta única. Executa, responde, encerra.
```bash
node agent.js "o que é recursão?"
```

**Conceitos:** API integration, async/await, environment variables

---

### v2 - Memória
**Arquivo:** `agent-v2.js`

Chat contínuo com histórico de conversa mantido durante a sessão.
```bash
node agent-v2.js
# Conversa interativa
# Digite "sair" para encerrar
```

**Conceitos:** State management, conversationHistory, recursion, readline

---

### v3 - Executor
**Arquivo:** `agent-v3.js`

Agente que executa comandos bash no sistema operacional.
```bash
node agent-v3.js
# "liste os arquivos" → executa ls -la
# "crie pasta teste" → executa mkdir teste
```

**Conceitos:** child_process, command execution, regex pattern matching

---

### v3-safe - Segurança
**Arquivo:** `agent-v3-safe.js`

Adiciona camada de segurança com confirmação para comandos perigosos.
```bash
node agent-v3-safe.js
# "delete tudo" → pede confirmação antes
```

**Conceitos:** Blacklist validation, user confirmation, safety patterns

---

### v4 - Multi-Ferramentas
**Arquivo:** `agent-v4.js`

Agente que decide autonomamente qual ferramenta usar: bash, clima ou conversa normal.
```bash
node agent-v4.js
# "clima em Paris" → usa OpenWeather API
# "liste arquivos" → usa bash
# "olá" → conversa normal
```

**Conceitos:** Multi-tool orchestration, API integration, decision making

### v5 - Multi-Ferramentas COMPLETO ⭐
**Arquivo:** `agent-v5.js`

Agente final com 5 ferramentas integradas: bash, clima, busca web, conversão de moedas e conversa.
```bash
node agent-v5.js
# "liste arquivos" → bash
# "clima em Paris" → OpenWeather API
# "notícias sobre IA" → Google Custom Search
# "100 dólares em reais" → Exchange Rate API
# "olá" → conversa normal
```

**Conceitos:** Multi-API orchestration, decision making, complete tool ecosystem

---

## 🚀 Começando

### Pré-requisitos

- Node.js 18+
- Conta Google AI (Gemini API)
- Conta OpenWeather (API gratuita)

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/GFN33/ai-agent-cli.git
cd ai-agent-cli
```

2. Instale dependências:
```bash
npm install
```

3. Configure variáveis de ambiente:

Crie arquivo `.env`:
```
GEMINI_API_KEY=sua_key_aqui
OPENWEATHER_API_KEY=sua_key_aqui
```

**Obter API Keys:**
- Gemini: https://aistudio.google.com/app/apikey
- OpenWeather: https://openweathermap.org/api

### Uso

Escolha a versão desejada:
```bash
# v1 - Pergunta única
node agent.js "sua pergunta"

# v2 - Chat com memória
node agent-v2.js

# v3 - Executor de comandos
node agent-v3.js

# v3-safe - Executor seguro
node agent-v3-safe.js

# v4 - Multi-ferramentas
node agent-v4.js
```

## 🏗️ Arquitetura

### v4 - Fluxo de Decisão
```
User Input
    ↓
Gemini analisa intenção
    ↓
Decide ferramenta (BASH/CLIMA/CONVERSA)
    ↓
┌─────────┬─────────┬─────────┐
BASH      CLIMA     CONVERSA
↓         ↓         ↓
exec()    API       texto
↓         ↓         ↓
Resultado formatado
```

### Gerenciamento de Contexto
```javascript
conversationHistory = [
  { role: "user", parts: [{ text: "oi" }] },
  { role: "model", parts: [{ text: "Olá!" }] },
  { role: "user", parts: [{ text: "meu nome é Gabriel" }] },
  { role: "model", parts: [{ text: "Prazer, Gabriel!" }] }
]
// Histórico completo enviado a cada interação
```

## 🛠️ Stack Técnica

- **Runtime:** Node.js
- **LLM:** Google Gemini 2.0 Flash
- **APIs:** OpenWeather
- **Libs:** @google/generative-ai, dotenv, readline, child_process

## 📈 Próximas Evoluções

- [ ] Busca web (Google Custom Search API)
- [ ] Conversão de moedas
- [ ] RAG (busca em documentos)
- [ ] Persistência de histórico
- [ ] Multi-agentes especializados

## 🔒 Segurança

- API keys protegidas via `.env`
- `.gitignore` configurado
- Blacklist de comandos perigosos (v3-safe)
- Confirmação de usuário para ações destrutivas

## 📝 Aprendizados

Este projeto demonstra:
- Evolução incremental de complexidade
- Integração de múltiplas APIs
- Gerenciamento de estado em aplicações conversacionais
- Padrões de segurança para agentes executivos
- Arquitetura multi-ferramenta com LLMs

## 👤 Autor

**Gabriel Felipe do Nascimento**

- GitHub: [@GFN33](https://github.com/GFN33)
- LinkedIn: [Gabriel Felipe]

## 📄 Licença

MIT License

