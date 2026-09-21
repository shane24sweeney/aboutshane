import './App.css';
import Education from './components/education/education';
import HeadShot from './components/resume/resume/headshot/HeadShot';
import About from './components/about/About';
import AccordionComponent from './components/accordian/index.js';
import Testimonials from './components/testimonials/testimonials/Testimonials';
import Email from './components/email/index.js';
import Charity from './components/resume/resume/headshot/Charity';
import Navigation from './components/navigation/index.js';
import Footer from './components/footer/index.js';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SiteProvider } from './context/SiteContext';

function App() {
  return (
    <div className="responsive">
      <div className="box">
        <SiteProvider>
          <BrowserRouter>
            <Navigation />
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<HeadShot />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Email />} />
              <Route path="/resume" element={<AccordionComponent />} />
              <Route path="/testimonials" element={<Testimonials />} />
              <Route path="/education" element={<Education />} />
              <Route path="/charity" element={<Charity />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </BrowserRouter>
          <Footer />
        </SiteProvider>
      </div>
    </div>
  );
}

export default App;
