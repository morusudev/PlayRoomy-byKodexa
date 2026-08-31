# PlayRoomy

**Watch party sincronizado para YouTube**

by **[Kodexa](https://kodexalabs.com.br)**

Crie uma sala, mande o link e assista com quem quiser. Play, pause, seek e playlist no mesmo tempo para todo mundo. Sem app, sem cadastro, direto no navegador.

🌐 **Ao vivo:** [playroomy.vercel.app](https://playroomy.vercel.app)

📖 **English:** [README.md](./README.md)

---

## 🎬 O que é

O PlayRoomy é um app web para maratonar YouTube com amigos. Um host cria a sala, os convidados entram pelo link e o vídeo fica sincronizado em tempo real.

Funciona em celular, tablet e PC. Ideal para grupos no WhatsApp, Discord ou call.

---

## ✨ O que dá pra fazer

| Recurso | Detalhe |
|---------|---------|
| 🔄 Sync em tempo real | Play, pause e seek sincronizados |
| 🔗 Convite por link | Um link, qualquer dispositivo |
| 📋 Playlist compartilhada | Fila de vídeos para a sala inteira |
| 💬 Chat ao vivo | Mensagens enquanto assistem |
| 🔒 Sala com senha | Privacidade opcional |
| ⌨️ Atalhos de teclado | Controle rápido no player |
| 📱 Mobile friendly | Layout pensado pro celular |

---

## 🏗️ Como funciona

```
Frontend (Vercel)          Backend (Discloud)
     │                            │
     │    WebSocket /roomy-ws     │
     └────────────────────────────┘
              Salas em memória
```

O **frontend** é React + Vite + Tailwind.  
O **backend** é Node.js + WebSocket (`ws`). Sem banco de dados: as salas existem só enquanto há gente conectada.

---

## 🚀 Rodar localmente

**Requisitos:** Node.js 20+

```bash
git clone https://github.com/morusudev/PlayRoomy-byKodexa.git
cd PlayRoomy-byKodexa
npm install
```

Crie um `.env.local` na raiz com os valores que precisar (veja o `.env` para a lista de variáveis). O `.env.local` não vai pro Git.

```bash
npm run dev
```

Abra o link **https** que aparece no terminal (o Vite sobe frontend e WebSocket juntos).

### Compartilhar na internet sem deploy

```bash
npm run share
```

Gera um link público temporário enquanto seu PC estiver ligado.

---

## 📦 Deploy em produção

### Frontend → Vercel

Conecte o repositório na Vercel. O `.vercelignore` já exclui `backend/` do upload.

**Build:** `npm run build`  
**Output:** `dist`

Configure as variáveis no painel da Vercel (não commite valores reais no Git).

### Backend → Discloud

```bash
npm run pack:discloud
```

Envie o `playroomy-discloud.zip` na Discloud (plano Platinum+, 512 MB).

Guia completo: [DEPLOY.md](./DEPLOY.md)

---

## ⚙️ Variáveis de ambiente

| Camada | Arquivo de referência | Onde configurar |
|--------|----------------------|-----------------|
| Frontend | `.env` | Painel Vercel ou `.env.local` |
| Backend | `backend/.env` | Painel Discloud |

---

## 📁 Estrutura do projeto

```
├── src/              # Frontend React
├── backend/          # API WebSocket (Discloud)
├── plugins/          # Plugins Vite (dev local)
├── server/           # Servidor monolito (opcional)
├── scripts/          # Utilitários (tunnel, zip Discloud)
└── DEPLOY.md         # Guia de deploy
```

---

## 🛠️ Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Zustand · WebSocket (ws) · YouTube IFrame API

---

## 🤝 Contribuir

Issues e PRs são bem vindos. Fork, branch, commit e abra um pull request.

---

## 📄 Licença

[MIT](./LICENSE) © 2026 Kodexa Labs

---

<p align="center">
  Feito com ☕ pela <strong><a href="https://kodexalabs.com.br">Kodexa</a></strong>
</p>
