import React from "react";
import Shane from "./Shane.jpg";
import { Card, Image } from 'semantic-ui-react'
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import Carousel from 'react-bootstrap/Carousel';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaGithub, FaLinkedin } from 'react-icons/fa';

const theme = createTheme({
  typography: {
    fontSize: 16,
    fontFamily: ['Raleway', 'sans-serif'].join(','),
  },
});

function HeadShot() {
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

  return (
    <ThemeProvider theme={theme}>
      <Card
        centered
        className="home-profile"
      >
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
            <Image className="home-photo" src={Shane} alt="Shane James Sweeney" fluid rounded />
            <Card.Content>
              <Card.Header>
                <h2 className="home-slide-title">
                  Professional Summary - 27 Years in Quality Engineering
                </h2>
              </Card.Header>

              <Card.Description>
                <p className="home-slide-copy home-slide-copy-lead">
                  Quality engineering professional with <b>27+ years of experience</b> spanning software engineering, SQA, test automation, performance
                  engineering, and enterprise quality leadership.
                </p>
                <p className="home-slide-copy">
                  Proven expertise in <b>architecting scalable automation frameworks</b>{' '}
                  for web, mobile, API, and backend systems across banking, healthcare,
                  enterprise software, telecommunications, and utility products.
                </p>
                <p className="home-slide-copy">
                  Experienced in Agile delivery, application modernization, performance
                  testing, CI/CD enablement, technical mentoring, and
                  <b> cross-functional stakeholder leadership</b>.
                </p>
                <p className="home-slide-copy">
                  Combines hands-on engineering depth with strategic quality leadership
                  to improve reliability, delivery speed, and organizational capability.
                </p>

              </Card.Description>
            </Card.Content>
          </Carousel.Item>

          <Carousel.Item className="home-slide">
            <Image className="home-photo" src={Shane} alt="Shane James Sweeney" fluid rounded />
            <Card.Content extra>
              <Card.Header>
                    <h2 className="home-slide-title">
                        Core Strengths - Quality Engineering & Automation
                    </h2>
                </Card.Header>
              <Card.Group itemsPerRow={2} stackable>
                {coreStrengths.map((item, idx) => (
                  <Card key={idx}>
                    <Card.Content>
                      <Card.Description>{item}</Card.Description>
                    </Card.Content>
                  </Card>
                ))}
              </Card.Group>
            </Card.Content>
          </Carousel.Item>

          <Carousel.Item className="home-slide" interval={15000}>
            <Image className="home-photo" src={Shane} alt="Shane James Sweeney" fluid rounded />
            <Card.Content extra>
              <h2 className="home-slide-title">
                Career Highlights - 27-Year Quality Engineering Career
              </h2>
              <p className="home-slide-copy home-framework-copy">
                Designed and implemented automation frameworks in Java, Groovy (GEB/Spock), Playwright, JavaScript, TypeScript, C#, and Selenium, incorporating BDD and TDD practices to enhance test reliability and maintainability.
              </p>
              <Card.Group itemsPerRow={1} stackable>
                {careerHighlights.map((item, idx) => (
                  <Card key={idx}>
                    <Card.Content>
                      <Card.Description>
                        <span className="career-highlight-label">{item.label}</span>
                        <span className="career-highlight-text">{item.text}</span>
                      </Card.Description>
                    </Card.Content>
                  </Card>
                ))}
              </Card.Group>
            </Card.Content>
          </Carousel.Item>
        </Carousel>
      </Card>
    </ThemeProvider>
  );
}

export default HeadShot;
