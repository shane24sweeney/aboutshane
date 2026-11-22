import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import { initAnalytics, trackPageView } from './analytics/analytics';
import ConsentBanner from './components/ConsentBanner';
import Footer from './components/Footer';
import Navigation from './components/Navigation';
import SiteSearch from './components/SiteSearch';
import Home from './pages/Home';

const About = lazy(() => import('./pages/About'));
const Charity = lazy(() => import('./pages/Charity'));
const Contact = lazy(() => import('./pages/Contact'));
const Education = lazy(() => import('./pages/Education'));
const Metrics = lazy(() => import('./pages/Metrics'));
const Resume = lazy(() => import('./pages/Resume'));
const Running = lazy(() => import('./pages/Running'));
const Testimonials = lazy(() => import('./pages/Testimonials'));
const Visitors = lazy(() => import('./pages/Visitors'));

/** Routes and layout; the router itself is supplied by the caller so tests can use a MemoryRouter. */
function App() {
  const { pathname } = useLocation();
  useEffect(() => initAnalytics(), []);
  useEffect(() => trackPageView(pathname), [pathname]);

  return (
    <div className="site-shell">
      <div className="site-frame">
        <Navigation />
        <SiteSearch />
        <main>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/resume" element={<Resume />} />
              <Route path="/testimonials" element={<Testimonials />} />
              <Route path="/education" element={<Education />} />
              <Route path="/charity" element={<Charity />} />
              <Route path="/running" element={<Running />} />
              <Route path="/metrics" element={<Metrics />} />
              <Route path="/visitors" element={<Visitors />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <ConsentBanner />
      </div>
    </div>
  );
}

export default App;
