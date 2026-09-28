import Carousel from 'react-bootstrap/Carousel';
import { FaEnvelope, FaGithub, FaLinkedin } from 'react-icons/fa';
import { Link } from 'react-router';
import shane from '../assets/Shane.jpg';
import PageLoading from '../components/PageLoading';
import SiteCarousel from '../components/SiteCarousel';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { usePageContent } from '../hooks/usePageContent';
import './Home.css';

/** Renders **double-asterisk** phrases in bold. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/).map((part, index) => (index % 2 === 1 ? <b key={index}>{part}</b> : part))}
    </>
  );
}

function Photo() {
  return <img className="home-photo rounded" src={shane} alt="Shane James Sweeney" />;
}

function Home() {
  const content = usePageContent('profile');
  // Each section is longer than a phone screen, so phones get them stacked instead of rotating.
  const isPhone = useMediaQuery('(max-width: 600px)');
  if (content.status === 'loading') return <PageLoading />;
  const profile = content.data;

  const sections = [
    {
      key: 'summary',
      body: (
        <div className="home-slide-body">
          <h2 className="home-slide-title">{profile.summaryTitle}</h2>
          {profile.summary.map((paragraph, index) => (
            <p key={paragraph} className={index === 0 ? 'home-slide-copy home-slide-copy-lead' : 'home-slide-copy'}>
              <RichText text={paragraph} />
            </p>
          ))}
        </div>
      ),
    },
    {
      key: 'strengths',
      body: (
        <div className="home-slide-body">
          <h2 className="home-slide-title">{profile.strengthsTitle}</h2>
          <ul className="home-card-grid home-card-grid-strengths">
            {profile.strengths.map((strength) => (
              <li key={strength} className="home-card">
                <span className="home-card-text">{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      key: 'highlights',
      interval: 15000,
      body: (
        <div className="home-slide-body">
          <h2 className="home-slide-title">{profile.highlightsTitle}</h2>
          <p className="home-slide-copy home-framework-copy">{profile.frameworks}</p>
          <ul className="home-card-grid home-card-grid-highlights">
            {profile.highlights.map(({ label, text }) => (
              <li key={label} className="home-card">
                <span className="home-card-text">
                  <span className="career-highlight-label">{label}</span>
                  <span className="career-highlight-text">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
  ];

  return (
    <section className="home-profile">
      <header className="home-hero">
        <h1 className="home-hero-name">{profile.name}</h1>
        <p className="home-hero-role">{profile.headline}</p>
        <p className="home-hero-meta">{profile.meta}</p>
        <div className="home-hero-actions">
          <Link className="home-hero-button home-hero-button-primary" to="/contact">
            <FaEnvelope aria-hidden="true" /> Contact me
          </Link>
          <a className="home-hero-button" href="https://linkedin.com/in/shane-sweeney-37a934135" target="_blank" rel="noreferrer">
            <FaLinkedin aria-hidden="true" /> LinkedIn
          </a>
          <a className="home-hero-button" href="https://github.com/shane24sweeney" target="_blank" rel="noreferrer">
            <FaGithub aria-hidden="true" /> GitHub
          </a>
        </div>
      </header>

      {isPhone ? (
        <div className="home-sections">
          <Photo />
          {sections.map(({ key, body }) => (
            <section key={key} className="home-section">
              {body}
            </section>
          ))}
        </div>
      ) : (
        <SiteCarousel label="Career overview" className="home-carousel" interval={10000}>
          {sections.map(({ key, interval, body }) => (
            <Carousel.Item key={key} className="home-slide" interval={interval}>
              <Photo />
              {body}
            </Carousel.Item>
          ))}
        </SiteCarousel>
      )}
    </section>
  );
}

export default Home;
