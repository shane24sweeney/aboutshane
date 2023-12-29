import React from "react";
import { Accordion, AccordionSummary, AccordionDetails } from '@material-ui/core';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import  "../testimonials/testimonials.css";
import resume from "./resume/resume";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { HeaderContent } from "semantic-ui-react";


const theme = createTheme({
  typography: {
    fontSize: "10px",
    fontFamily: [
      'Raleway', 'sans-serif',
      
    ].join(','),
  },});



function Resume() {

  const [expand, setExpand] = React.useState(false);
  const toggleAcordion = () => {
    setExpand((prev) => !prev);
  };

  

 return (
  <div class="container">
    <li className="resume"    style={{
          height: '100%',
          padding: '60px', 
          borderRadius: '10px',
          backgroundColor: 'black'
      }} >
    

<ThemeProvider theme={theme} >

      <Accordion expanded={expand} >
      <AccordionSummary
      expandIcon={<ExpandMoreIcon fontSize="large" />}
      aria-controls="panel1a-content"
      IconButtonProps={{
        onClick: toggleAcordion
      }}
    >
        <Typography variant="h2" gutterBottom>
        <resume image={resume[0].image} title={resume[0].title} description = {resume[0].description}/>
        <img src ={resume[0].image} alt={resume[0].title}/>
        <HeaderContent style = {{textAlign: 'center'}} > <h1>{resume[0].title}</h1> </HeaderContent> 
        </Typography>
        </AccordionSummary>
        <AccordionDetails>
        <Typography variant="h2" gutterBottom>
        <p>
        <p>{resume[0].description}</p>
        </p>
        </Typography>
        </AccordionDetails>
      </Accordion>
     
      <p></p>

      <Accordion expanded={expand} >
      <AccordionSummary
      expandIcon={<ExpandMoreIcon fontSize="large" />}
      aria-controls="panel1a-content"
      IconButtonProps={{
        onClick: toggleAcordion
      }}
    >
        <Typography variant="h2" gutterBottom>
        <resume image={resume[1].image} title={resume[1].title} description = {resume[1].description}/>
        <img src ={resume[1].image} alt={resume[1].title}/>
        <HeaderContent style = {{textAlign: 'center'}} >  <h1>{resume[1].title}</h1></HeaderContent> 
        </Typography>
        </AccordionSummary>
        <AccordionDetails>
        <Typography variant="h2" gutterBottom>
        <p>
        <p>{resume[1].description}</p>
        </p>
        </Typography>
        </AccordionDetails>
      </Accordion>
     
      <p></p>

      <Accordion expanded={expand}>
      <AccordionSummary
      expandIcon={<ExpandMoreIcon fontSize="large" />}
      aria-controls="panel1a-content"
      IconButtonProps={{
        onClick: toggleAcordion
      }}
    >
  <Typography variant="h2" gutterBottom>
  <resume image={resume[2].image} title={resume[2].title} description = {resume[2].description}/>
  <img src ={resume[2].image} alt={resume[2].title}/>
  <HeaderContent style = {{textAlign: 'center'}} >  <h1>{resume[2].title}</h1></HeaderContent> 
  </Typography>
  </AccordionSummary>
  <AccordionDetails>
  <Typography variant="h2" gutterBottom>
  <p>
  <p>{resume[2].description}</p>
  </p>
  </Typography>
  </AccordionDetails>
</Accordion>
     
<p></p>

<Accordion expanded={expand}>
      <AccordionSummary
      expandIcon={<ExpandMoreIcon fontSize="large" />}
      aria-controls="panel1a-content"
      IconButtonProps={{
        onClick: toggleAcordion
      }}
    >
  <Typography variant="h2" gutterBottom>
  <resume image={resume[3].image} title={resume[3].title} description = {resume[3].description}/>
  <img src ={resume[3].image} alt={resume[3].title}/>
  <HeaderContent style = {{textAlign: 'center'}} >  <h1>{resume[3].title}</h1></HeaderContent> 
  </Typography>
  </AccordionSummary>
  <AccordionDetails>
  <Typography variant="h2" gutterBottom>
  <p>
  <p>{resume[3].description}</p>
  </p>
  </Typography>
  </AccordionDetails>
</Accordion>    

<p></p>

<Accordion expanded={expand}>
      <AccordionSummary
      expandIcon={<ExpandMoreIcon fontSize="large" />}
      aria-controls="panel1a-content"
      IconButtonProps={{
        onClick: toggleAcordion
      }}
    >
  <Typography variant="h2" gutterBottom>
  <resume image={resume[4].image} title={resume[4].title} description = {resume[4].description}/>
  <img src ={resume[4].image} alt={resume[4].title}/>
  <HeaderContent style = {{textAlign: 'center'}} >  <h1>{resume[4].title}</h1></HeaderContent> 
  </Typography>
  </AccordionSummary>
  <AccordionDetails>
  <Typography variant="h2" gutterBottom>
  <p>
  <p>{resume[4].description}</p>
  </p>
  </Typography>
  </AccordionDetails>
</Accordion>

<p></p>

<Accordion expanded={expand}>
      <AccordionSummary
      expandIcon={<ExpandMoreIcon fontSize="large" />}
      aria-controls="panel1a-content"
      IconButtonProps={{
        onClick: toggleAcordion
      }}
    >
  <Typography variant="h2" gutterBottom>
  <resume image={resume[5].image} title={resume[5].title} description = {resume[5].description}/>
  <img src ={resume[5].image} alt={resume[5].title}/>
  <HeaderContent style = {{textAlign: 'center'}} >  <h1>{resume[5].title}</h1></HeaderContent> 
  </Typography>
  </AccordionSummary>
  <AccordionDetails>
  <Typography variant="h2" gutterBottom>
  <p>
  <p>{resume[5].description}</p>
  </p>
  </Typography>
  </AccordionDetails>
</Accordion>

<p></p>

<Accordion expanded={expand}>
      <AccordionSummary
      expandIcon={<ExpandMoreIcon fontSize="large" />}
      aria-controls="panel1a-content"
      IconButtonProps={{
        onClick: toggleAcordion
      }}
    >
  <Typography variant="h2" gutterBottom>
  <resume image={resume[6].image} title={resume[6].title} description = {resume[6].description}/>
  <img src ={resume[6].image} alt={resume[6].title}/>
  <HeaderContent style = {{textAlign: 'center'}} >  <h1>{resume[6].title}</h1></HeaderContent> 
  </Typography>
  </AccordionSummary>
  <AccordionDetails>
  <Typography variant="h2" gutterBottom>
  <p>
  <p>{resume[6].description}</p>
  </p>
  </Typography>
  </AccordionDetails>
</Accordion>

<p></p>

<Accordion expanded={expand}>
      <AccordionSummary
      expandIcon={<ExpandMoreIcon fontSize="large" />}
      aria-controls="panel1a-content"
      IconButtonProps={{
        onClick: toggleAcordion
      }}
    >
  <Typography variant="h2" gutterBottom>
  <resume image={resume[7].image} title={resume[7].title} description = {resume[7].description}/>
  <img src ={resume[7].image} alt={resume[7].title}/>
  <HeaderContent style = {{textAlign: 'center'}} >  <h1>{resume[7].title}</h1></HeaderContent> 
  </Typography>
  </AccordionSummary>
  <AccordionDetails>
  <Typography variant="h2" gutterBottom>
  <p>
  <p>{resume[7].description}</p>
  </p>
  </Typography>
  </AccordionDetails>
</Accordion>

<p></p>

<Accordion expanded={expand}>
      <AccordionSummary
      expandIcon={<ExpandMoreIcon fontSize="large" />}
      aria-controls="panel1a-content"
      IconButtonProps={{
        onClick: toggleAcordion
      }}
    >
  <Typography variant="h2" gutterBottom>
  <resume image={resume[8].image} title={resume[8].title} description = {resume[8].description}/>
  <img src ={resume[8].image} alt={resume[8].title}/>
  <HeaderContent style = {{textAlign: 'center'}} >  <h1>{resume[8].title}</h1></HeaderContent> 
  </Typography>
  </AccordionSummary>
  <AccordionDetails>
  <Typography variant="h2" gutterBottom>
  <p>
  <p>{resume[8].description}</p>
  </p>
  </Typography>
  </AccordionDetails>
</Accordion>

</ThemeProvider>
  </li>
  </div>
  );
};
export default Resume
