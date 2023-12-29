import React from "react";
import  "../testimonials/testimonials.css";
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Carousel from 'react-bootstrap/Carousel';
import Workout1 from "../resume/resume/headshot/Workout1.png";
import Workout2 from "../resume/resume/headshot/Workout2.png";
import Workout3 from "../resume/resume/headshot/Workout3.png";
import { Card,  Image } from 'semantic-ui-react';


const theme = createTheme({
  typography: {
    fontSize: "10px",
    fontFamily: [
      'Raleway', 'sans-serif',
      
    ].join(','),
  },});

function about () {
  

  return (
    <ThemeProvider theme={theme} className="justify-content-center" >
    <section id="about" >
    <Card centered  
    style={{
      height: '100%',
      padding: '60px', 
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    >
   <Carousel  controls={false} indicators={false}>
      <Carousel.Item interval={4000} 
    >
         <Typography variant="h1" gutterBottom >
      
         <p>
         Your mind is clear. Your heart rate is racing with anticipation and
        excitement. The world's surroundings suddenly disappear and it's just
        you and the open road ahead. That is running a race in a nutshell. For
        an avid runner, this is the motivation to keep going. Completing
        something from start to finish for a sense of accomplishment and
        victory. The feeling and high from being a software developer is very
        similar. You receive the same satisfaction of seeing something through
        from beginning to end. The excitement and anticipation of knowing you're
        about to create something new is unlike any other. A challenge has been
        extended and accepted, and it's time to see it through to victory. I am
        both a runner and a software developer, and feel very fortunate to be
        able to experience such satisfaction in both my career and fitness
        journey.
        </p>
        <p></p>
          <cite>
            Shane James Sweeney,  You have to fail to succeed
          </cite>
   </Typography>
   </Carousel.Item>
   <Carousel.Item interval={4000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Workout1} wrapped ui={true} />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={4000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Workout2} wrapped ui={true} />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={4000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Workout3} wrapped ui={true} />
    </Typography>
    </Carousel.Item>
   </Carousel>
     </Card>
     </section>
      </ThemeProvider>
  );
};
export default about
