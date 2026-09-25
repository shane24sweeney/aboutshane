import Carousel from 'react-bootstrap/Carousel';
import { FaEnvelope, FaGithub, FaLinkedin } from 'react-icons/fa';
import { Link } from 'react-router';
import shane from '../assets/Shane.jpg';
import './Home.css';

const coreStrengths = [
  'Enterprise Quality Strategy',
  'Automation Architecture',
  'Test Strategy Development',
  'Process Optimization & Improvement',
  'Performance Engineering',
  'Risk Governance Frameworks',
  'Program Management Expertise',
  'Scalability Planning',
  'Continuous Delivery Enablement',
  'Stakeholder Alignment',
  'Regulatory Compliance Oversight',
  'Change Management',
  'Organizational Coaching',
  'Talent Development Coaching',
  'Strategic Roadmap Execution',
];

const careerHighlights = [
  { label: 'Automation Impact', text: 'Reduced regression testing time by 60% by automating thousands of test cases.' },
  { label: 'Quality Strategy', text: 'Led UI, API, scale, regression, and PDF validation initiatives across all U.S. counties.' },
  { label: 'Team Leadership', text: 'Mentored junior and senior QA engineers through coaching and documentation, strengthening automation practices.' },
  { label: 'Delivery & Performance', text: 'Ran automation and performance tests with Jenkins, GitHub Workflows, Postman, Apache JMeter, and BlazeMeter, then presented QA results in sprint demos to stakeholders.' },
  { label: 'Quality Engineering', text: 'Used GitHub Copilot and Claude to accelerate test script development by 40%, while applying SonarQube to improve automation code quality.' },
];

function Photo() {
  return <img className="home-photo rounded" src={shane} alt="Shane James Sweeney" />;
}

function Home() {
  return (
    <section className="home-profile">
      <header className="home-hero">
        <h1 className="home-hero-name">Shane James Sweeney</h1>
        <p className="home-hero-role">Senior QE Lead &amp; Test Automation Architect</p>
        <p className="home-hero-meta">27+ years in quality engineering · Kennesaw, GA</p>
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

      <Carousel className="home-carousel" controls={false} indicators={false} interval={10000} pause="hover">
        <Carousel.Item className="home-slide">
          <Photo />
          <div className="home-slide-body">
            <h2 className="home-slide-title">Professional Summary - 27 Years in Quality Engineering</h2>
            <p className="home-slide-copy home-slide-copy-lead">
              Quality engineering professional with <b>27+ years of experience</b> spanning software engineering, SQA,
              test automation, performance engineering, and enterprise quality leadership.
            </p>
            <p className="home-slide-copy">
              Proven expertise in <b>architecting scalable automation frameworks</b> for web, mobile, API, and backend
              systems across banking, healthcare, enterprise software, telecommunications, and utility products.
            </p>
            <p className="home-slide-copy">
              Experienced in Agile delivery, application modernization, performance testing, CI/CD enablement,
              technical mentoring, and <b>cross-functional stakeholder leadership</b>.
            </p>
            <p className="home-slide-copy">
              Combines hands-on engineering depth with strategic quality leadership to improve reliability, delivery
              speed, and organizational capability.
            </p>
          </div>
        </Carousel.Item>

        <Carousel.Item className="home-slide">
          <Photo />
          <div className="home-slide-body">
            <h2 className="home-slide-title">Core Strengths - Quality Engineering &amp; Automation</h2>
            <ul className="home-card-grid home-card-grid-strengths">
              {coreStrengths.map((strength) => (
                <li key={strength} className="home-card">
                  <span className="home-card-text">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        </Carousel.Item>

        <Carousel.Item className="home-slide" interval={15000}>
          <Photo />
          <div className="home-slide-body">
            <h2 className="home-slide-title">Career Highlights - 27-Year Quality Engineering Career</h2>
            <p className="home-slide-copy home-framework-copy">
              Designed and implemented automation frameworks in Java, Groovy (GEB/Spock), Playwright, JavaScript,
              TypeScript, C#, and Selenium, incorporating BDD and TDD practices to enhance test reliability and
              maintainability.
            </p>
            <ul className="home-card-grid home-card-grid-highlights">
              {careerHighlights.map(({ label, text }) => (
                <li key={label} className="home-card">
                  <span className="home-card-text">
                    <span className="career-highlight-label">{label}</span>
                    <span className="career-highlight-text">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Carousel.Item>
      </Carousel>
    </section>
  );
}

export default Home;
