# PlayRoomy

**Watch party sincronizado para YouTube**

by **[Kodexa](https://kodexalabs.com.br)**

Crie uma sala, mande o link e assista com quem quiser. Play, pause, seek e playlist no mesmo tempo para todo mundo. Sem app, sem cadastro — direto no navegador.

🌐 **Ao vivo:** [playroomy.vercel.app](https://playroomy.vercel.app)

📖 **English:** [README.md](./README.md)

---

## O que é

O PlayRoomy é um app web para maratonar YouTube com amigos. Um host cria a sala, os convidados entram pelo link e o vídeo fica sincronizado em tempo real.

Funciona em celular, tablet e PC. Ideal para grupos no WhatsApp, Discord ou call.

---

## O que dá pra fazer

| Recurso | Detalhe |
|---------|---------|
| Sync em tempo real | Play, pause e seek sincronizados |
| Convite por link | Um link, qualquer dispositivo |
| Playlist compartilhada | Fila de vídeos para a sala inteira |
| Chat e reações | Mensagens enquanto assistem |
| Sala com senha | Privacidade opcional |
| Atalhos de teclado | Controle rápido no player |
| Mobile friendly | Layout pensado pro celular |

---

## Como funciona

```
Frontend                     Backend (API WebSocket)
     │                              │
     │     WebSocket /roomy-ws      │
     └──────────────────────────────┘
              Salas em memória
```

O **frontend** é React + Vite + Tailwind.  
O **backend** é Node.js + WebSocket (`ws`). Sem banco de dados: as salas existem só enquanto há gente conectada.

---

## Rodar localmente

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

## Deploy em produção

### Frontend

Faça deploy do app Vite (ex.: Vercel). O `.vercelignore` já exclui `backend/` do upload.

**Build:** `npm run build`  
**Output:** `dist`

Configure as variáveis no painel do host (não commite valores reais no Git).

Aponte `VITE_WS_URL` para a origem WebSocket do backend (o app adiciona `/roomy-ws` quando precisar).

### Backend

Rode a API em `backend/` em qualquer host com processo Node persistente e suporte a WebSocket.

```bash
cd backend
npm install
npm run dev
```

Veja `backend/.env.example` para as variáveis (`PORT`, `ALLOWED_ORIGINS`, limites de sala, etc.).

Mais detalhes: [DEPLOY.md](./DEPLOY.md) · [backend/README.md](./backend/README.md)

---

## Variáveis de ambiente

| Camada | Arquivo de referência | Onde configurar |
|--------|----------------------|-----------------|
| Frontend | `.env` | Painel do host ou `.env.local` |
| Backend | `backend/.env.example` | Host da API / `.env` |

---

## Estrutura do projeto

```
├── src/              # Frontend React
├── backend/          # API WebSocket
├── plugins/          # Plugins Vite (dev local)
├── server/           # Servidor monolito (opcional)
├── scripts/          # Utilitários (tunnel, empacote)
└── DEPLOY.md         # Guia de deploy
```

---

## Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Zustand · WebSocket (ws) · YouTube IFrame API

---

## Contribuir

Issues e PRs são bem vindos. Fork, branch, commit e abra um pull request.

---

## Licença

[MIT](./LICENSE) © 2026 Kodexa Labs

---

<p align="center">
  Feito com ☕ pela <strong><a href="https://kodexalabs.com.br">Kodexa</a></strong>
</p>
