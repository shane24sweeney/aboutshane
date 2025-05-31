import React from "react";
import  "../testimonials/testimonials.css";
import { Card } from 'react-bootstrap';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Carousel from 'react-bootstrap/Carousel';
import UCC from "../resume/resume/headshot/UCC.jpeg";
import NCState from '../resume/resume/headshot/NCState.jpeg';



const educationdescript =
[
{ 
degree: "Masters in Computer Science - 2015" 
}
,
{ 
degree: "Higher Diploma Computer Science - 1998/1999" 
},

{ 
degree: "B.A. Mathematical Studies and Sociology - 1995/1998" 
},
]

const theme = createTheme({
  typography: {
    fontSize: "10px",
    fontFamily: [
      'Raleway', 'sans-serif',

    ].join(','),
  },});

function education () {


  return (
    <section id="education" >
    <ThemeProvider theme={theme}>
      <Card
     centered    className="flex-container"
     style={{
      height: '100vh',
      padding: '1px', 
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
  }}
>
    <Carousel controls={false} indicators={false}>
    <Carousel.Item interval={4000} 
  >
    <img
        className="testimonial"
src={NCState}
        alt=""
      />
       <Typography variant="h1" gutterBottom>
       {educationdescript[0].degree}
       </Typography>

      <div >
</div>
</Carousel.Item>



    <Carousel.Item interval={4000} 
  >
    <img
        className="testimonial"
src={UCC}
        alt=""
      />
       <Typography variant="h1" gutterBottom>
       {educationdescript[1].degree}
       </Typography>

      <div >
</div>
</Carousel.Item>


    <Carousel.Item interval={4000} 
  >
    <img
        className="testimonial"
src={UCC}
        alt=""
      />

    <div >
       <Typography variant="h2" gutterBottom>
       {educationdescript[2].degree}

</Typography>

</div>
</Carousel.Item>
</Carousel>
</Card>
</ThemeProvider>
</section>
  );
};
export default education
