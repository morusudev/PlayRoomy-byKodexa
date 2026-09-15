# PlayRoomy

**Synchronized YouTube watch parties**

by **[Kodexa](https://kodexalabs.com.br)**

Create a room, share the link, and watch together. Play, pause, seek, and playlists stay in sync for everyone. No app install, no sign up — runs in the browser.

🌐 **Live:** [playroomy.vercel.app](https://playroomy.vercel.app)

📖 **Português:** [README.pt-BR.md](./README.pt-BR.md)

---

## What is it?

PlayRoomy is a web app to binge YouTube with friends. A host creates a room, guests join via link, and video playback stays synchronized in real time.

Works on phone, tablet, and desktop. Great for WhatsApp groups, Discord, or voice calls.

---

## Features

| Feature | Details |
|---------|---------|
| Real-time sync | Play, pause, and seek stay aligned |
| Invite by link | One link, any device |
| Shared playlist | Queue videos for the whole room |
| Live chat & reactions | Hang out while you watch |
| Password rooms | Optional privacy |
| Keyboard shortcuts | Fast player controls |
| Mobile friendly | Layout built for phones |

---

## Architecture

```
Frontend                     Backend (WebSocket API)
     │                              │
     │     WebSocket /roomy-ws      │
     └──────────────────────────────┘
              In-memory rooms
```

**Frontend:** React + Vite + Tailwind  
**Backend:** Node.js + WebSocket (`ws`)  
No database. Rooms exist only while people are connected.

---

## Run locally

**Requirements:** Node.js 20+

```bash
git clone https://github.com/morusudev/PlayRoomy-byKodexa.git
cd PlayRoomy-byKodexa
npm install
```

Create `.env.local` at the project root with your values (see `.env` for the variable list). `.env.local` is not committed.

```bash
npm run dev
```

Open the **https** URL from the terminal. Local dev runs frontend and WebSocket together.

### Share from your PC without deploy

```bash
npm run share
```

Creates a temporary public link while your machine stays on.

---

## Production deploy

### Frontend

Deploy the Vite app (e.g. Vercel). `.vercelignore` excludes `backend/` from the upload.

**Build:** `npm run build`  
**Output:** `dist`

Set environment variables in your host dashboard. Do not commit real secrets to Git.

Point `VITE_WS_URL` at your backend WebSocket origin (the app appends `/roomy-ws` when needed).

### Backend

Run the API in `backend/` on any host that supports a persistent Node process and WebSockets.

```bash
cd backend
npm install
npm run dev
```

See `backend/.env.example` for variables (`PORT`, `ALLOWED_ORIGINS`, room limits, etc.).

More detail: [DEPLOY.md](./DEPLOY.md) · [backend/README.md](./backend/README.md)

---

## Environment variables

| Layer | Reference file | Where to set values |
|-------|----------------|---------------------|
| Frontend | `.env` | Host dashboard or `.env.local` |
| Backend | `backend/.env.example` | Your API host / `.env` |

---

## Project structure

```
├── src/              # React frontend
├── backend/          # WebSocket API
├── plugins/          # Vite plugins (local dev)
├── server/           # Optional monolith server
├── scripts/          # Tunnel and packaging utilities
└── DEPLOY.md         # Deploy guide
```

---

## Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Zustand · WebSocket (ws) · YouTube IFrame API

---

## Contributing

Issues and pull requests are welcome. Fork, branch, commit, and open a PR.

---

## License

[MIT](./LICENSE) © 2026 Kodexa Labs

---

<p align="center">
  Made with ☕ by <strong><a href="https://kodexalabs.com.br">Kodexa</a></strong>
</p>
