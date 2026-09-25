import Accordion from 'react-bootstrap/Accordion';
import PageLoading from '../components/PageLoading';
import { logos } from '../content/images';
import type { ResumeEntry } from '../content/types';
import { usePageContent } from '../hooks/usePageContent';
import './Resume.css';

function entryTitle({ role, company, contractVia }: ResumeEntry) {
  const title = `${role} - ${company}`.toUpperCase();
  return contractVia ? `${title} (Contract via ${contractVia})` : title;
}

function Resume() {
  const content = usePageContent('resume');

  return (
    <div className="resume-page">
      <h1 className="visually-hidden">Professional Experience</h1>
      {content.status === 'loading' ? (
        <PageLoading />
      ) : (
        <div className="resume-card">
          <Accordion>
            {content.data.map((entry, index) => (
              <Accordion.Item key={`${entry.company}-${entry.role}`} eventKey={String(index)}>
                <Accordion.Header>
                  <img className="resume-logo" src={logos[entry.logo]} alt={`${entry.company} logo`} width={50} height={50} />
                  <span className="resume-title">{entryTitle(entry)}</span>
                </Accordion.Header>
                <Accordion.Body>
                  {entry.meta && <p className="resume-meta">{entry.meta}</p>}
                  {entry.summary && <p className="resume-summary">{entry.summary}</p>}
                  {entry.highlights.length > 0 && (
                    <ul className="resume-highlights">
                      {entry.highlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                  )}
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
}

export default Resume;
