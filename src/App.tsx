import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/Home'
import { RoomPage } from './pages/Room'
import { JoinPage } from './pages/Join'
import { Toaster } from './components/ui/Toaster'
import { SecureContextBanner } from './components/SecureContextBanner'

export default function App() {
  return (
    <div className="h-full">
      <SecureContextBanner>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
            <Route path="/join/:roomId" element={<JoinPage />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </SecureContextBanner>
    </div>
  )
}
