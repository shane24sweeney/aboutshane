import React from "react";
import CharityWork from "../headshot/CharityWork.png";
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
    <Card centered    className="flex-container flex-item"
    style={{
      height: '100%',
      padding: '15px', 
      borderRadius: '40px',
      boxShadow: '15px 15px 15px 15px rgb(20 20 20 / 60%)',
      width: '500px',
    }}
>
    <Carousel>
      <Carousel.Item interval={4000} 
         >
               <Typography variant="h1" gutterBottom>
            Raised money and took part in the polar plunge for the Special Olympics
            </Typography>
         <p></p>
         <p></p>
         <img
             className="testimonial"
   src={CharityWork}
             alt=""
           />
        
           <Carousel.Caption>
      
          
           </Carousel.Caption>
         </Carousel.Item>

<Carousel.Item interval={4000} 
         >
            <Typography variant="h1" gutterBottom>
           Support Website for Dog Days Rescue
           <ButtonDogDaysPositive/>
           </Typography>
         <p></p>
         <p></p>
         <img
             
   src={DogDays}
             alt=""
           />
         
         </Carousel.Item>
         <Carousel.Item interval={4000} 
         >
            <Typography variant="h1" gutterBottom>
           Raised money and ran in the Susan G Komen Race For The Cure
         </Typography>
         <p></p>
         <p></p>
         <img
             
   src={RaceCure}
             alt=""
           />
         
         </Carousel.Item>
 </Carousel>

 
 </Card>
 </ThemeProvider>
 
  )
};

export default Charity;
