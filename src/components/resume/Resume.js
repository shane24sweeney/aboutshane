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

  const [userTitleFirst, setUserDescFirst] = useState(resume[0].title)
  const descriptionFirst = resume[0].description;

  const [userTitleSecond, setUserDescSecond] = useState(resume[1].title)
  const descriptionSecond = resume[1].description;

  const [userTitleThird, setUserDescThird] = useState(resume[2].title)
  const descriptionThird = resume[2].description;

  const [userTitleForth, setUserDescForth] = useState(resume[3].title)
  const descriptionForth = resume[3].description;

  const [userTitleFifth, setUserDescFifth] = useState(resume[4].title)
  const descriptionFifth = resume[4].description;

  const [userTitleSixth, setUserDescSixth] = useState(resume[5].title)
  const descriptionSixth = resume[5].description;

  const [userTitleSeventh, setUserDescSeventh] = useState(resume[6].title)
  const descriptionSeventh = resume[6].description;

  const [userTitleEight, setUserDescEight] = useState(resume[7].title)
  const descriptionEight = resume[7].description;

  const [userTitleNinth, setUserDescNinth] = useState(resume[8].title)
  const descriptionNinth = resume[8].description;
  

  const [expand, setExpand] = useState(false);
  const toggleAcordion = () => {
    setExpand((prev) => !prev);
   
  };

  

 return (
  <div class="container" >
    <li className="resume"      style={{
          height: '100%',
          padding: '60px', 
          borderRadius: '10px',
          backgroundColor: 'black',
          color:'white',
          textAlign: 'center'
      }} >
    

<ThemeProvider theme={theme}   
>
<div id="accordion" class="panel-group"  sx={{
    backgroundColor: "black"
  }}  >
         <Accordion expanded={expand}
         slotProps={{ transition: { unmountOnExit: true } }}>
      <AccordionSummary
      expandIcon={<ExpandMoreIcon fontSize="large"/>}
      aria-controls="panel1a-content"
      IconButtonProps onClick = {() => setExpand(!expand)}>
              
        
        <Typography variant="h2" gutterBottom>
               <resume image={resume[0].image}
                 title={userTitleFirst}
                 description={resume[0].description}
          
                />
        <img src ={resume[0].image} alt={resume[0].title}/>
        <HeaderContent style = {{textAlign: 'center'}} > 
        <h1>{resume[0].title}</h1> </HeaderContent> 
        </Typography>
        </AccordionSummary>
        <AccordionDetails>
        <Typography variant="h2" gutterBottom>
        <p>
                 <div onClick={() => setUserDescFirst(descriptionFirst)}>{descriptionFirst}</div>
                 
      </p>
        </Typography>
        </AccordionDetails>
      </Accordion>
     
      <p></p>

      <Accordion expanded={expand}
      slotProps={{ transition: { unmountOnExit: true } }} >
      <AccordionSummary
      expandIcon={<ExpandMoreIcon fontSize="large" />}
      aria-controls="panel1a-content"
      IconButtonProps={{
        onClick: toggleAcordion
      }}
    >
        <Typography variant="h2" gutterBottom>
        <resume image={resume[1].image} title={userTitleSecond} description = {resume[1].description}/>
        <img src ={resume[1].image} alt={resume[1].title}/>
        <HeaderContent style = {{textAlign: 'center'}} >  <h1>{resume[1].title}</h1></HeaderContent> 
        </Typography>
        </AccordionSummary>
        <AccordionDetails>
        <Typography variant="h2" gutterBottom>
        <p>
        <div onClick={() => setUserDescSecond(descriptionSecond)}>{descriptionSecond}</div>
        </p>
        </Typography>
        </AccordionDetails>
      </Accordion>
     
      <p></p>

      <Accordion expanded={expand}
      slotProps={{ transition: { unmountOnExit: true } }}>
      <AccordionSummary
      expandIcon={<ExpandMoreIcon fontSize="large" />}
      aria-controls="panel1a-content"
      IconButtonProps={{
        onClick: toggleAcordion
      }}
    >
  <Typography variant="h2" gutterBottom>
  <resume image={resume[2].image} title={userTitleThird} description = {resume[2].description}/>
  <img src ={resume[2].image} alt={resume[2].title}/>
  <HeaderContent style = {{textAlign: 'center'}} >  <h1>{resume[2].title}</h1></HeaderContent> 
  </Typography>
  </AccordionSummary>
  <AccordionDetails>
  <Typography variant="h2" gutterBottom>
  <p>
  <div onClick={() => setUserDescThird(descriptionThird)}>{descriptionThird}</div>
  </p>
  </Typography>
  </AccordionDetails>
</Accordion>
     
<p></p>

<Accordion expanded={expand}
slotProps={{ transition: { unmountOnExit: true } }}>
      <AccordionSummary
      expandIcon={<ExpandMoreIcon fontSize="large" />}
      aria-controls="panel1a-content"
      IconButtonProps={{
        onClick: toggleAcordion
      }}
    >
  <Typography variant="h2" gutterBottom>
  <resume image={resume[3].image} title={userTitleForth} description = {resume[3].description}/>
  <img src ={resume[3].image} alt={resume[3].title}/>
  <HeaderContent style = {{textAlign: 'center'}} >  <h1>{resume[3].title}</h1></HeaderContent> 
  </Typography>
  </AccordionSummary>
  <AccordionDetails>
  <Typography variant="h2" gutterBottom>
  <p>
  <div onClick={() => setUserDescForth(descriptionForth)}>{descriptionForth}</div>
  </p>
  </Typography>
  </AccordionDetails>
</Accordion>    

<p></p>

<Accordion expanded={expand}
slotProps={{ transition: { unmountOnExit: true } }}>
      <AccordionSummary
      expandIcon={<ExpandMoreIcon fontSize="large" />}
      aria-controls="panel1a-content"
      IconButtonProps={{
        onClick: toggleAcordion
      }}
    >
  <Typography variant="h2" gutterBottom>
  <resume image={resume[4].image} title={userTitleFifth} description = {resume[4].description}/>
  <img src ={resume[4].image} alt={resume[4].title}/>
  <HeaderContent style = {{textAlign: 'center'}} >  <h1>{resume[4].title}</h1></HeaderContent> 
  </Typography>
  </AccordionSummary>
  <AccordionDetails>
  <Typography variant="h2" gutterBottom>
  <p>
  <div onClick={() => setUserDescFifth(descriptionFifth)}>{descriptionFifth}</div>
  </p>
  </Typography>
  </AccordionDetails>
</Accordion>

<p></p>

<Accordion expanded={expand}
slotProps={{ transition: { unmountOnExit: true } }}>
      <AccordionSummary
      expandIcon={<ExpandMoreIcon fontSize="large" />}
      aria-controls="panel1a-content"
      IconButtonProps={{
        onClick: toggleAcordion
      }}
    >
  <Typography variant="h2" gutterBottom>
  <resume image={resume[5].image} title={userTitleSixth} description = {resume[5].description}/>
  <img src ={resume[5].image} alt={resume[5].title}/>
  <HeaderContent style = {{textAlign: 'center'}} >  <h1>{resume[5].title}</h1></HeaderContent> 
  </Typography>
  </AccordionSummary>
  <AccordionDetails>
  <Typography variant="h2" gutterBottom>
  <p>
  <div onClick={() => setUserDescSixth(descriptionSixth)}>{descriptionSixth}</div>
  </p>
  </Typography>
  </AccordionDetails>
</Accordion>

<p></p>

<Accordion expanded={expand}
slotProps={{ transition: { unmountOnExit: true } }}>
      <AccordionSummary
      expandIcon={<ExpandMoreIcon fontSize="large" />}
      aria-controls="panel1a-content"
      IconButtonProps={{
        onClick: toggleAcordion
      }}
    >
  <Typography variant="h2" gutterBottom>
  <resume image={resume[6].image} title={userTitleSeventh} description = {resume[6].description}/>
  <img src ={resume[6].image} alt={resume[6].title}/>
  <HeaderContent style = {{textAlign: 'center'}} >  <h1>{resume[6].title}</h1></HeaderContent> 
  </Typography>
  </AccordionSummary>
  <AccordionDetails>
  <Typography variant="h2" gutterBottom>
  <p>
  <div onClick={() => setUserDescSeventh(descriptionSeventh)}>{descriptionSeventh}</div>
  </p>
  </Typography>
  </AccordionDetails>
</Accordion>

<p></p>

<Accordion expanded={expand}
slotProps={{ transition: { unmountOnExit: true } }}>
      <AccordionSummary
      expandIcon={<ExpandMoreIcon fontSize="large" />}
      aria-controls="panel1a-content"
      IconButtonProps={{
        onClick: toggleAcordion
      }}
    >
  <Typography variant="h2" gutterBottom>
  <resume image={resume[7].image} title={userTitleEight} description = {resume[7].description}/>
  <img src ={resume[7].image} alt={resume[7].title}/>
  <HeaderContent style = {{textAlign: 'center'}} >  <h1>{resume[7].title}</h1></HeaderContent> 
  </Typography>
  </AccordionSummary>
  <AccordionDetails>
  <Typography variant="h2" gutterBottom>
  <p>
  <div onClick={() => setUserDescEight(descriptionEight)}>{descriptionEight}</div>
  </p>
  </Typography>
  </AccordionDetails>
</Accordion>

<p></p>

<Accordion expanded={expand}
slotProps={{ transition: { unmountOnExit: true } }}>
      <AccordionSummary
      expandIcon={<ExpandMoreIcon fontSize="large" />}
      aria-controls="panel1a-content"
      IconButtonProps={{
        onClick: toggleAcordion
      }}
    >
  <Typography variant="h2" gutterBottom>
  <resume image={resume[8].image} title={userTitleNinth} description = {resume[8].description}/>
  <img src ={resume[8].image} alt={resume[8].title}/>
  <HeaderContent style = {{textAlign: 'center'}} >  <h1>{resume[8].title}</h1></HeaderContent> 
  </Typography>
  </AccordionSummary>
  <AccordionDetails>
  <Typography variant="h2" gutterBottom>
  <p>
  <div onClick={() => setUserDescNinth(descriptionNinth)}>{descriptionNinth}</div>
  </p>
  </Typography>
  </AccordionDetails>
</Accordion>


</div>
</ThemeProvider>

  </li>
  </div>
  );
};
export default Resume
