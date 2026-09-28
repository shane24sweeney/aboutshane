import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import Footer from './components/Footer';
import Navigation from './components/Navigation';
import Home from './pages/Home';

const About = lazy(() => import('./pages/About'));
const Charity = lazy(() => import('./pages/Charity'));
const Contact = lazy(() => import('./pages/Contact'));
const Education = lazy(() => import('./pages/Education'));
const Resume = lazy(() => import('./pages/Resume'));
const Testimonials = lazy(() => import('./pages/Testimonials'));

/** Routes and layout; the router itself is supplied by the caller so tests can use a MemoryRouter. */
function App() {
  return (
    <div className="site-shell">
      <div className="site-frame">
        <Navigation />
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
