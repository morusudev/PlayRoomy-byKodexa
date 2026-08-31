import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { HomePage } from './pages/Home'
import { RoomPage } from './pages/Room'
import { JoinPage } from './pages/Join'
import { Toaster } from './components/ui/Toaster'
import { SecureContextBanner } from './components/SecureContextBanner'
import { PageSeo } from './components/seo/PageSeo'
import { getSeoForPath } from './seo'

function AppRoutes() {
  const location = useLocation()
  const seo = getSeoForPath(location.pathname)

  return (
    <>
      <PageSeo
        title={seo.title}
        description={seo.description}
        pathname={location.pathname}
        noindex={seo.noindex}
      />
      <div key={location.pathname} className="h-full animate-fade-in">
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
          <Route path="/join/:roomId" element={<JoinPage />} />
        </Routes>
      </div>
      <Toaster />
    </>
  )
}

export default function App() {
  return (
    <div className="h-full">
      <SecureContextBanner>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </SecureContextBanner>
    </div>
  )
}
