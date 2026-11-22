import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import Footer from './components/Footer';
import Navigation from './components/Navigation';
import SiteSearch from './components/SiteSearch';
import Home from './pages/Home';
import { pageModules, prefetchAllWhenIdle } from './prefetch';

// The same imports prefetch.ts warms up, so a prefetched page renders without waiting.
const About = lazy(pageModules['/about']);
const Charity = lazy(pageModules['/charity']);
const Contact = lazy(pageModules['/contact']);
const Education = lazy(pageModules['/education']);
const Metrics = lazy(pageModules['/metrics']);
const Resume = lazy(pageModules['/resume']);
const Running = lazy(pageModules['/running']);
const Testimonials = lazy(pageModules['/testimonials']);

const PREFETCH = ['/home', '/resume', '/about', '/contact', '/testimonials', '/education', '/charity', '/running', '/metrics'];

/** Routes and layout; the router itself is supplied by the caller so tests can use a MemoryRouter. */
function App() {
  useEffect(() => prefetchAllWhenIdle(PREFETCH), []);

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
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default App;
