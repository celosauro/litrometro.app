import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import HomePage from './pages/HomePage';
import SobrePage from './pages/SobrePage';
import ContatoPage from './pages/ContatoPage';
import PrivacidadePage from './pages/PrivacidadePage';
import TermosPage from './pages/TermosPage';
import { trackPageView } from './utils/analytics';

export default function App() {
  const location = useLocation();

  // Rastreia mudanças de página (SPA)
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/sobre" element={<SobrePage />} />
        <Route path="/contato" element={<ContatoPage />} />
        <Route path="/privacidade" element={<PrivacidadePage />} />
        <Route path="/termos" element={<TermosPage />} />
      </Route>
    </Routes>
  );
}
