# PlayRoomy API

Backend WebSocket para salas sincronizadas. Hospede na **Discloud**.

## Antes do upload

1. Edite `discloud.config` e defina `ID` com o seu subdomínio Discloud
2. Gere o zip na raiz do monorepo:

```bash
npm run pack:discloud
```

3. No painel da Discloud, configure as variáveis (veja `.env.example`)

### Variáveis obrigatórias em produção

| Variável | Exemplo |
|----------|---------|
| `ALLOWED_ORIGINS` | `https://playroomy.vercel.app` |

Use a URL **exata** do frontend, sem barra no final. Várias origens: separe por vírgula.

### Variáveis opcionais

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `MAX_ROOMS` | 120 | Salas simultâneas |
| `MAX_CONNECTIONS` | 350 | Conexões WebSocket totais |
| `MAX_PARTICIPANTS` | 20 | Pessoas por sala |
| `MAX_QUEUE_ITEMS` | 40 | Itens na playlist |
| `EMPTY_ROOM_GRACE_MS` | 90000 | Ms antes de apagar sala vazia |

## Upload

1. Faça upload de `playroomy-discloud.zip` no painel da Discloud
2. Aguarde o build (`npm install`) e o start (`npm start`)
3. Confirme nos logs:

```
[playroomy] API listening on http://0.0.0.0:8080
[playroomy] WebSocket at /roomy-ws
```

## Teste

- Health: `https://SEU-ID.discloud.app/health` → `{"ok":true,"service":"playroomy-api"}`
- WebSocket: `wss://SEU-ID.discloud.app/roomy-ws`

## Frontend (Vercel)

No painel da Vercel, configure:

```
VITE_WS_URL=wss://SEU-ID.discloud.app
```

O app adiciona `/roomy-ws` automaticamente.

## Desenvolvimento local

```bash
cd backend
npm install
cp .env.example .env
# Edite ALLOWED_ORIGINS se necessário
npm run dev
```

API em `http://localhost:8080`, WebSocket em `ws://localhost:8080/roomy-ws`.
