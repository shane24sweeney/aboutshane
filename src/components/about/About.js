import React from "react";
import  "../testimonials/testimonials.css";
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Carousel from 'react-bootstrap/Carousel';
import { Card, Image } from 'react-bootstrap';
import Workout1 from "../resume/resume/headshot/Workout1.png";
import Workout2 from "../resume/resume/headshot/Workout2.png";
import Workout3 from "../resume/resume/headshot/Workout3.png";
import Workout4 from "../resume/resume/headshot/Workout4.png";
import Workout5 from "../resume/resume/headshot/Workout5.png";
import Workout6 from "../resume/resume/headshot/Workout6.png";
import Workout7 from "../resume/resume/headshot/Workout7.png";
import Workout8 from "../resume/resume/headshot/Workout8.png";
import Workout9 from "../resume/resume/headshot/Workout9.png";
import Workout10 from "../resume/resume/headshot/Workout10.png";
import Workout11 from "../resume/resume/headshot/Workout11.png";
import Workout12 from "../resume/resume/headshot/Workout12.png";
import Workout13 from "../resume/resume/headshot/Workout13.png";
import Workout14 from "../resume/resume/headshot/Workout14.png";
import Challenge1 from "../resume/resume/headshot/Challenge1.png";
import Challenge2 from "../resume/resume/headshot/Challenge2.png";
import Challenge3 from "../resume/resume/headshot/Challenge3.png";
import Challenge4 from "../resume/resume/headshot/Challenge4.png";
import Challenge5 from "../resume/resume/headshot/Challenge5.png";
import Challenge6 from "../resume/resume/headshot/Challenge6.png";
import Challenge7 from "../resume/resume/headshot/Challenge7.png";
import Challenge8 from "../resume/resume/headshot/Challenge8.png";
import Challenge9 from "../resume/resume/headshot/Challenge9.png";
import Challenge10 from "../resume/resume/headshot/Challenge10.png";
import Challenge11 from "../resume/resume/headshot/Challenge11.png";
import Challenge12 from "../resume/resume/headshot/Challenge12.png";


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
    <Card 
    className="mx-auto d-flex"
    style={{
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      padding: '16px',
      marginBottom: '24px'
    }}
    bg="dark"
    text="white"
    >
   <Carousel  controls={false} indicators={false}>
      <Carousel.Item interval={5000} 
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
   <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image 
      src={Challenge1} 
      fluid
      className="d-block mx-auto"
      style={{
        height: '100vh',
        borderRadius: '10px',
        backgroundColor: 'black',
        color:'white'
      }}
    />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image 
      src={Challenge2} 
      fluid
      className="d-block mx-auto"
      style={{
        height: '100vh',
        borderRadius: '10px',
        backgroundColor: 'black',
        color:'white'
      }}
    />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image 
      src={Challenge3} 
      fluid
      className="d-block mx-auto"
      style={{
        height: '100vh',
        borderRadius: '10px',
        backgroundColor: 'black',
        color:'white'
      }}
    />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image 
      src={Challenge4} 
      fluid
      className="d-block mx-auto"
      style={{
        height: '100vh',
        borderRadius: '10px',
        backgroundColor: 'black',
        color:'white'
      }}
    />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Challenge5} 
     style={{
      height: '100vh',
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    wrapped ui={true} />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Challenge6} 
     style={{
      height: '100vh',
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    wrapped ui={true} />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Challenge7} 
     style={{
      height: '100vh',
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    wrapped ui={true} />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Challenge8} 
     style={{
      height: '100vh',
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    wrapped ui={true} />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Challenge9} 
     style={{
      height: '100vh',
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    wrapped ui={true} />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Challenge10} 
     style={{
      height: '100vh',
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    wrapped ui={true} />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Challenge11} 
     style={{
      height: '100vh',
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    wrapped ui={true} />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Challenge12} 
     style={{
      height: '100vh',
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    wrapped ui={true} />
    </Typography>
    </Carousel.Item>
   <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Workout1} 
     style={{
      height: '100vh',
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    wrapped ui={true} />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Workout2} 
     style={{
      height: '100vh',
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    wrapped ui={true} />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Workout3} 
     style={{
      height: '100vh',
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    wrapped ui={true} />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Workout4} 
     style={{
      height: '100vh',
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    wrapped ui={true} />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Workout5} 
     style={{
      height: '100vh',
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    wrapped ui={true} />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Workout6} 
     style={{
      height: '100vh',
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    wrapped ui={true} />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Workout7} 
     style={{
      height: '100vh',
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    wrapped ui={true} />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Workout8} 
     style={{
      height: '100vh',
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    wrapped ui={true} />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Workout9} 
     style={{
      height: '100vh',
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    wrapped ui={true} />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Workout10} 
     style={{
      height: '100vh',
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    wrapped ui={true} />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Workout11} 
     style={{
      height: '100vh',
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    wrapped ui={true} />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Workout12} 
     style={{
      height: '100vh',
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    wrapped ui={true} />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Workout13} 
     style={{
      height: '100vh',
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    wrapped ui={true} />
    </Typography>
    </Carousel.Item>
    <Carousel.Item interval={1000} 
    >
    <Typography variant="h1" gutterBottom>
    <Image src={Workout14} 
     style={{
      height: '100vh',
      borderRadius: '10px',
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
    }}
    wrapped ui={true} />
    </Typography>
    </Carousel.Item>
   </Carousel>
     </Card>
     </section>
      </ThemeProvider>
  );
};
export default about
