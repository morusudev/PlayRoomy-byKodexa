# PlayRoomy API

Backend WebSocket para salas sincronizadas. Hospede na **Discloud**.

## Upload

1. Na raiz do monorepo: `npm run pack:discloud`
2. Edite `discloud.config` com o seu subdomínio (`ID`)
3. Configure as variáveis do `backend/.env` no painel da Discloud
4. Faça upload do `playroomy-discloud.zip`

## Teste

`https://SEU-ID.discloud.app/health` → `{"ok":true}`

WebSocket: `wss://SEU-ID.discloud.app/roomy-ws`
