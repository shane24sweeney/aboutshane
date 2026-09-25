import React from "react";
import CharityWork from "../headshot/CharityWork.png";
import Dalton from "../headshot/Dalton.jpg";
import Habitat from "../headshot/Habitat.jpg";
import DogDays from "../headshot/DogDays.png";
import RaceCure from "../headshot/SusanKomen.jpeg";
import { Card, Button } from 'react-bootstrap';
import Carousel from 'react-bootstrap/Carousel';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const portfoliaopt =
[
{ title: "https://www.dogdaysrescue.org/",
websitelink: "Dog Days Rescue Charity" 
}

]
const theme = createTheme({
  typography: {
    fontSize: "16px",
    fontFamily: [
      'Raleway', 'sans-serif',

    ].join(','),
  },});

  const ButtonDogDaysPositive = () => (
    <div>
       <Typography variant="h1" component="div" gutterBottom>
      <Button variant="success" href={portfoliaopt[0].title} className="rounded-pill"
      >{portfoliaopt[0].websitelink}</Button>
      </Typography>
    </div>
  )

const Charity = () => {
  return (
    <section id="charity" className="charity-page">
      <h1 className="visually-hidden">Charity Work</h1>
      <ThemeProvider theme={theme}>
      <Card 
    className="charity-card mx-auto d-flex"
    style={{
      height: '100vh',
      padding: '1px', 
      backgroundColor: 'black',
      color:'white'
  }}
    bg="dark"
    text="white"
    >
    <Carousel className="charity-carousel" controls={false} indicators={false}>
      <Carousel.Item interval={4000} 
         >
               <Typography variant="h1" component="div" gutterBottom>
            <h2>
            Raised money and took part in the polar plunge for the Special Olympics
            </h2>
            </Typography>
         <img
             className="testimonial uniform-img"
   src={CharityWork}
             alt="Polar plunge for the Special Olympics"
           />


         </Carousel.Item>

<Carousel.Item interval={4000} 
         >
            <Typography variant="h1" component="div" gutterBottom>
          <h2>Support Website for Dog Days Rescue</h2> 
           <ButtonDogDaysPositive/>
           </Typography>
         <img
             className="uniform-img"
   src={DogDays}
             alt="Dog Days Rescue"
           />

         </Carousel.Item>
         <Carousel.Item interval={4000} 
         >
            <Typography variant="h1" component="div" gutterBottom>
          <h2>Raised money and ran in the Susan G Komen Race For The Cure</h2> 
         </Typography>
         <img
             className="uniform-img"
   src={RaceCure}
             alt="Susan G. Komen Race for the Cure"
           />

         </Carousel.Item>

         <Carousel.Item interval={4000} 
         >
            <Typography variant="h1" component="div" gutterBottom>
          <h2>Yearly Dalton Ten Miler Race for Charity</h2> 
         </Typography>
         <img
             className="uniform-img"
   src={Dalton}
             alt="Dalton Ten Miler race"
           />

         </Carousel.Item>

         <Carousel.Item interval={4000} 
         >
            <Typography variant="h1" component="div" gutterBottom>
          <h2>Yearly 18K Habitat for Humanity Helen Race for Charity</h2> 
         </Typography>
         <img
             className="uniform-img"
   src={Habitat}
             alt="Habitat for Humanity Helen 18K race"
           />

         </Carousel.Item>
 </Carousel>


      </Card>
    </ThemeProvider>
  </section>

  )
};

export default Charity;
