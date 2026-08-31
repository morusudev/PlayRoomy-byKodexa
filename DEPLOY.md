# Deploy PlayRoomy

Arquitetura em produção:

- **Frontend** → Vercel (interface + links de convite)
- **Backend** → Discloud (WebSocket + salas em memória)

As credenciais e URLs reais ficam **somente** nos painéis da Vercel e Discloud. O repositório traz apenas os arquivos `.env` vazios como referência.

---

## 1. Backend na Discloud

### Gerar o zip

Na raiz do projeto:

```bash
npm run pack:discloud
```

Isso cria `playroomy-discloud.zip` (sem `node_modules`). Faça upload desse arquivo na Discloud.

### Requisitos

- Plano **Platinum+** (site com porta HTTP)
- Subdomínio criado no painel
- **512 MB RAM** (já configurado em `discloud.config`)

### Passos

1. Edite `backend/discloud.config` e defina `ID` com o seu subdomínio
2. No painel da Discloud, configure as variáveis listadas em `backend/.env`
3. Faça upload do zip gerado
4. Confirme nos logs:

```
[playroomy] API listening on http://0.0.0.0:8080
[playroomy] WebSocket at /roomy-ws
```

5. Teste: `https://SEU-ID.discloud.app/health` → `{ "ok": true }`

### Limites padrão (512 MB)

| Limite | Valor |
|--------|-------|
| Salas simultâneas | 120 |
| Conexões WebSocket | 350 |
| Pessoas por sala | 20 |
| Itens na playlist | 40 |
| Sala vazia expira em | 90s |

Ajuste via env no painel: `MAX_ROOMS`, `MAX_CONNECTIONS`, `MAX_PARTICIPANTS`, etc.

---

## 2. Frontend na Vercel

1. Conecte o repositório GitHub na Vercel
2. **Root Directory:** raiz do projeto (não `backend/`)
3. O `.vercelignore` já exclui `backend/`, `server/` e `plugins/` do deploy
4. **Build Command:** `npm run build`
5. **Output:** `dist`

### Variáveis de ambiente

Configure no painel da Vercel as variáveis descritas no `.env` da raiz:

- `VITE_PUBLIC_URL`
- `VITE_WS_URL`
- `VITE_GITHUB_URL`
- `VITE_BRAND_BY`
- `VITE_APP_ID`

`VITE_WS_URL` não precisa de `/roomy-ws` no final. O app adiciona automaticamente.

6. Deploy. Abra o site, crie uma sala e teste com outro dispositivo.

---

## 3. Desenvolvimento local

```bash
npm run dev
```

Para simular frontend e backend separados, crie `.env.local` na raiz:

```env
VITE_WS_URL=ws://localhost:8080
```

E rode o backend em outro terminal:

```bash
cd backend && npm install && npm run dev
```

---

## 4. Open source

Quem clonar o repositório pode:

- Rodar local com `npm run dev`
- Hospedar o próprio backend na Discloud
- Hospedar o próprio frontend na Vercel

Cada instância configura suas próprias variáveis nos painéis de hospedagem.

---

## Checklist pós deploy

- [ ] `/health` responde na Discloud
- [ ] `ALLOWED_ORIGINS` inclui a URL exata do frontend
- [ ] `VITE_WS_URL` usa `wss://` (não `ws://`)
- [ ] Criar sala → copiar link → abrir em outro navegador → sync funciona
