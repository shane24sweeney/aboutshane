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
                  Summary - Technical QA Manager
                </h1>
              </Card.Header>

              <Card.Description style={{ color: 'white', backgroundColor: 'black' }}>
                <p style={{ fontSize: '1.1rem', lineHeight: 1.7, marginTop: 16 }}>
                  Seasoned QA leader with <b>26+ years of experience</b> driving
                  <b> enterprise-wide quality engineering</b> initiatives,
                  <b> automation transformation,</b> and
                  <b> digital testing strategies</b>.
                </p>
                <p style={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                  Proven expertise in <b>architecting scalable automation frameworks</b>,
                  enhancing software reliability, and
                  <b> implementing process improvements</b> that align technology with
                  business outcomes.
                </p>
                <p style={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                  Adept at mentoring teams, fostering cross-functional collaboration,
                  and <b>influencing executive stakeholders</b> to deliver measurable
                  value. Recognized for combining technical depth with strategic
                  vision to <b>advance organizational</b> goals and innovation.
                </p>
                <p style={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                  Currently seeking opportunities to
                  <b> lead transformational quality initiatives</b> in
                  growth-oriented environments.
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
