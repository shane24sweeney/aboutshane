import React, { useState }  from "react";
import { Accordion, AccordionSummary, AccordionDetails } from '@material-ui/core';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import  "../testimonials/testimonials.css";
import resume from "./resume/resume";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { HeaderContent } from "semantic-ui-react";




const theme = createTheme({
  typography: {
    fontSize: "1px",
    fontFamily: [
      'Raleway', 'sans-serif',
      
    ].join(','),
  },});



function Resume() {
  const [expandedIndex, setExpandedIndex] = useState(null);

  return (
    <div className="container resume-page">
      <li className="resume resume-shell" style={{
        height: '100%',
        padding: '60px',
        borderRadius: '10px',
        backgroundColor: 'black',
        color: 'white',
        textAlign: 'center'
      }}>
        <ThemeProvider theme={theme}>
          <div id="accordion" className="panel-group" sx={{ backgroundColor: 'black' }}>
            {resume.map((role, index) => (
              <React.Fragment key={`${role.title}-${index}`}>
                <Accordion
                  expanded={expandedIndex === index}
                  onChange={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  slotProps={{ transition: { unmountOnExit: true } }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon fontSize="large" />}
                    aria-controls={`resume-panel-${index}-content`}
                    id={`resume-panel-${index}-header`}
                  >
                    <Typography variant="h2" gutterBottom>
                      {role.image ? (
                        <img className="uniform-img" src={role.image} alt={role.title} />
                      ) : (
                        <div className="resume-logo-fallback" aria-label={`${role.company} logo`}>
                          {role.company}
                        </div>
                      )}
                      <HeaderContent style={{ textAlign: 'center' }}>
                        <h1>{role.title}</h1>
                      </HeaderContent>
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="h2" gutterBottom>
                      <p style={{ whiteSpace: 'pre-line' }}>{role.description}</p>
                    </Typography>
                  </AccordionDetails>
                </Accordion>
                {index < resume.length - 1 && <p />}
              </React.Fragment>
            ))}
          </div>
        </ThemeProvider>
      </li>
    </div>
  );
}
export default Resume
