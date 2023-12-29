import React from "react";
import CharityWork from "../headshot/CharityWork.png";
import Dalton from "../headshot/Dalton.jpg";
import Habitat from "../headshot/Habitat.jpg";
import DogDays from "../headshot/DogDays.png";
import RaceCure from "../headshot/SusanKomen.jpeg";
import { Card } from 'semantic-ui-react';
import Carousel from 'react-bootstrap/Carousel';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Button } from "semantic-ui-react";

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
      <Button circular color='green' href= {portfoliaopt[0].title} class="ui toggle button"
      >{portfoliaopt[0].websitelink}</Button>
      </Typography>
    </div>
  )

const Charity = () => {
  return (
    <ThemeProvider theme={theme}>
    <Card centered   
    style={{
      height: '100%',
      padding: '1px', 
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
  }}
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
             className="testimonial"
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
             
   src={RaceCure}
             alt=""
           />
         
         </Carousel.Item>

         <Carousel.Item interval={4000} 
         >
            <Typography variant="h1" gutterBottom>
          <h1>Run in Dalton Ten Miler Yearly for Charity</h1> 
         </Typography>
         <img
             
   src={Habitat}
             alt=""
           />
         
         </Carousel.Item>

         <Carousel.Item interval={4000} 
         >
            <Typography variant="h1" gutterBottom>
          <h1>Ran in Habitat for Humanity Race in Helen for Charity</h1> 
         </Typography>
         <img
             
   src={Dalton}
             alt=""
           />
         
         </Carousel.Item>
 </Carousel>

 
 </Card>
 </ThemeProvider>
 
  )
};

export default Charity;
