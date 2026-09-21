import React from "react";
import Shane from "./Shane.jpg";
import { Card, Image } from 'semantic-ui-react'
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import Carousel from 'react-bootstrap/Carousel';

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
    'Reduced regression testing time  by 60 percent by automating 1000s of test cases',
    'Led QA initiatives for UI, API, and scale roadmap testing, including automated regression and PDF validations across all counties in the U.S.',
    'Mentored junior and senior QA team members through one-on-one coaching sessions and wiki documentation, improving team automation capabilities and adherence to best practices.',
    'Executed automation runs and performance tests using Jenkins, GitHub workflows, Postman, Apache JMeter, and BlazeMeter, while presenting QA results in sprint demos to stakeholders.',
    'Used GitHub Copilot and Claude to accelerate test script development by 40%, while applying SonarQube to improve automation code quality.',
  ];

  return (
    <ThemeProvider theme={theme}>
      <Card
        centered
        style={{
          maxWidth: '900px',
          width: '100%',
          margin: '24px auto',
          padding: '16px 24px',
          backgroundColor: 'black',
          color: 'white',
          border: '1px solid #222',
          textAlign: 'center',
        }}
      >
        <Carousel controls={false} indicators={false} interval={4000}>
          <Carousel.Item>
            <Image src={Shane} fluid rounded style={{ display: 'block', margin: '0 auto 16px' }} />
            <Card.Content style={{ color: 'white', backgroundColor: 'black', textAlign: 'center' }}>
              <Card.Header style={{ color: 'white', backgroundColor: 'black' }}>
                <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0' }}>
                  Professional Summary - 27 Years in Quality Engineering
                </h1>
              </Card.Header>

              <Card.Description style={{ color: 'white', backgroundColor: 'black' }}>
                <p style={{ fontSize: '1.1rem', lineHeight: 1.7, marginTop: 16 }}>
                  Quality engineering professional with <b>27+ years of experience</b>
                  spanning software engineering, SQA, test automation, performance
                  engineering, and enterprise quality leadership.
                </p>
                <p style={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                  Proven expertise in <b>architecting scalable automation frameworks</b>
                  for web, mobile, API, and backend systems across banking, healthcare,
                  enterprise software, telecommunications, and utility products.
                </p>
                <p style={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                  Experienced in Agile delivery, application modernization, performance
                  testing, CI/CD enablement, technical mentoring, and
                  <b> cross-functional stakeholder leadership</b>.
                </p>
                <p style={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                  Combines hands-on engineering depth with strategic quality leadership
                  to improve reliability, delivery speed, and organizational capability.
                </p>

              </Card.Description>
            </Card.Content>
          </Carousel.Item>

          <Carousel.Item>
            <Image src={Shane} fluid rounded style={{ display: 'block', margin: '0 auto 16px' }} />
            <Card.Content extra style={{ color: 'white', backgroundColor: 'black', textAlign: 'center' }}>
                <Card.Header style={{ color: 'white', backgroundColor: 'black' }}>
                    <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0' }}>
                        Core Strengths - Technical QA Manager
                    </h1>
                </Card.Header>
              <Card.Group itemsPerRow={2} stackable>
                {coreStrengths.map((item, idx) => (
                  <Card key={idx} style={{ backgroundColor: 'black', color: 'white', border: '1px solid #222', margin: '8px' }}>
                    <Card.Content>
                      <Card.Description style={{ color: 'white', fontSize: '1.05rem', lineHeight: 1.6, textAlign: 'center' }}>{item}</Card.Description>
                    </Card.Content>
                  </Card>
                ))}
              </Card.Group>
            </Card.Content>
          </Carousel.Item>

          <Carousel.Item>
            <Image src={Shane} fluid rounded style={{ display: 'block', margin: '0 auto 16px' }} />
            <Card.Content extra style={{ color: 'white', backgroundColor: 'black', textAlign: 'center' }}>
              <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0' }}>
                Career Highlights - Technical QA Manager
              </h1>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.7 }}>
                Designed and implemented automation frameworks in Java, Groovy (GEB/Spock), Playwright, C#, and Selenium, incorporating BDD and TDD practices to enhance test reliability and maintainability.
              </p>
              <Card.Group itemsPerRow={1} stackable>
                {careerHighlights.map((item, idx) => (
                  <Card key={idx} style={{ backgroundColor: 'black', color: 'white', border: '1px solid #222', margin: '8px' }}>
                    <Card.Content>
                      <Card.Description style={{ color: 'white', fontSize: '1.05rem', lineHeight: 1.6, textAlign: 'center' }}>{item}</Card.Description>
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
