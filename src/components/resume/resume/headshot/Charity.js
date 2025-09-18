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
       <Typography variant="h1" gutterBottom>
      <Button variant="success" href={portfoliaopt[0].title} className="rounded-pill"
      >{portfoliaopt[0].websitelink}</Button>
      </Typography>
    </div>
  )

const Charity = () => {
  return (
    <section id="charity">
      <ThemeProvider theme={theme}>
      <Card 
    className="mx-auto d-flex"
    style={{
      height: '100vh',
      padding: '1px', 
      backgroundColor: 'black',
      color:'white'
  }}
    bg="dark"
    text="white"
    >
    <Carousel controls={false} indicators={false}>
      <Carousel.Item interval={4000} 
         >
               <Typography variant="h1" gutterBottom>
            <h1>
            Raised money and took part in the polar plunge for the Special Olympics
            </h1>
            </Typography>
         <img
             className="testimonial uniform-img"
   src={CharityWork}
             alt=""
           />


         </Carousel.Item>

<Carousel.Item interval={4000} 
         >
            <Typography variant="h1" gutterBottom>
          <h1>Support Website for Dog Days Rescue</h1> 
           <ButtonDogDaysPositive/>
           </Typography>
         <img
             className="uniform-img"
   src={DogDays}
             alt=""
           />

         </Carousel.Item>
         <Carousel.Item interval={4000} 
         >
            <Typography variant="h1" gutterBottom>
          <h1>Raised money and ran in the Susan G Komen Race For The Cure</h1> 
         </Typography>
         <img
             className="uniform-img"
   src={RaceCure}
             alt=""
           />

         </Carousel.Item>

         <Carousel.Item interval={4000} 
         >
            <Typography variant="h1" gutterBottom>
          <h1>Yearly Dalton Ten Miler Race for Charity</h1> 
         </Typography>
         <img
             className="uniform-img"
   src={Dalton}
             alt=""
           />

         </Carousel.Item>

         <Carousel.Item interval={4000} 
         >
            <Typography variant="h1" gutterBottom>
          <h1>Yearly 18K Habitat for Humanity Helen Race for Charity</h1> 
         </Typography>
         <img
             className="uniform-img"
   src={Habitat}
             alt=""
           />

         </Carousel.Item>
 </Carousel>


      </Card>
    </ThemeProvider>
  </section>

  )
};

export default Charity;
