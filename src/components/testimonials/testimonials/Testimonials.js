import React from "react";
import Carousel from 'react-bootstrap/Carousel';
import  "../testimonials.css";
import { Card } from 'semantic-ui-react';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import testimonials from "../testimonials";


const theme = createTheme({
    typography: {
      fontSize: "10px",
      fontFamily: [
        'Raleway', 'sans-serif',
        
      ].join(','),
    },});
  
   
  
  function Testimonials (props)  {
  
    
   
    return (
      <ThemeProvider theme={theme}>
      <Card centered    className="flex-container flex-item"
      style={{
          height: '100%',
          padding: '15px', 
          borderRadius: '40px',
          boxShadow: '15px 15px 15px 15px rgb(20 20 20 / 60%)',
          width: '500px'
      }}
  >
      
         
      <Carousel>
        <Carousel.Item interval={4000} 
      >
         <testimonials image={testimonials[0].image} title={testimonials[0].title} description = {testimonials[0].description}/>

            <img src ={testimonials[0].image} alt={testimonials[0].title}/>
           
           <Typography variant="h1" gutterBottom>
           {testimonials[0].title}
           </Typography>
        
          <div >
        <span>   <Typography variant="h2" gutterBottom>
        {testimonials[0].recommendation}
           </Typography> </span>
       
          
        </div>
      
           
          <Carousel.Caption>
     
         
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[1].image} title={testimonials[1].title} description = {testimonials[0].description}/>

<img src ={testimonials[1].image} alt={testimonials[1].title}/>
       <Typography variant="h1" gutterBottom>
       {testimonials[1].title}
           </Typography>
        
          <div >
        <span>   <Typography variant="h2" gutterBottom>
        {testimonials[1].recommendation}
           </Typography> </span>
       
          
        </div>
          <Carousel.Caption>
        
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[2].image} title={testimonials[2].title} description = {testimonials[2].description}/>

        <img src ={testimonials[2].image} alt={testimonials[2].title}/>
        <Typography variant="h1" gutterBottom>
           {testimonials[2].title}
           </Typography>
        
          <div >
        <span>   <Typography variant="h2" gutterBottom>
           {testimonials[2].recommendation}
           </Typography> </span>
       
          
        </div>
          <Carousel.Caption>
        
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[3].image} title={testimonials[3].title} description = {testimonials[3].description}/>

<img src ={testimonials[3].image} alt={testimonials[3].title}/>
       <Typography variant="h1" gutterBottom>
           {testimonials[3].title}
           </Typography>
        
          <div >
        <span>   <Typography variant="h2" gutterBottom>
           {testimonials[3].recommendation}
           </Typography> </span>
       
          
        </div>
          <Carousel.Caption>
        
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[4].image} title={testimonials[4].title} description = {testimonials[4].description}/>

<img src ={testimonials[4].image} alt={testimonials[4].title}/>
       <Typography variant="h1" gutterBottom>
           {testimonials[4].title}
           </Typography>
        
          <div >
        <span>   <Typography variant="h2" gutterBottom>
           {testimonials[4].recommendation}
           </Typography> </span>
       
          
        </div>
          <Carousel.Caption>
        
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[5].image} title={testimonials[5].title} description = {testimonials[5].description}/>

<img src ={testimonials[5].image} alt={testimonials[5].title}/>
      <Typography variant="h1" gutterBottom>
           {testimonials[5].title}
           </Typography>
        
          <div >
        <span>   <Typography variant="h2" gutterBottom>
           {testimonials[5].recommendation}
           </Typography> </span>
       
          
        </div>
          <Carousel.Caption>
        
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item interval={4000}>
       
          
        <Typography variant="h1" gutterBottom>
           {testimonials[6].title}
           </Typography>
        
          <div >
        <span>   <Typography variant="h2" gutterBottom>
           {testimonials[6].recommendation}
           </Typography> </span>
       
          
        </div>
          <Carousel.Caption>
        
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[7].image} title={testimonials[7].title} description = {testimonials[7].description}/>

<img src ={testimonials[7].image} alt={testimonials[7].title}/>
      <Typography variant="h1" gutterBottom>
           {testimonials[7].title}
           </Typography>
        
          <div >
        <span>   <Typography variant="h2" gutterBottom>
           {testimonials[7].recommendation}
           </Typography> </span>
       
          
        </div>
          <Carousel.Caption>
        
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[8].image} title={testimonials[8].title} description = {testimonials[8].description}/>

<img src ={testimonials[8].image} alt={testimonials[8].title}/>
      <Typography variant="h1" gutterBottom>
           {testimonials[8].title}
           </Typography>
        
          <div >
        <span>   <Typography variant="h2" gutterBottom>
           {testimonials[8].recommendation}
           </Typography> </span>
       
          
        </div>
          <Carousel.Caption>
        
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[9].image} title={testimonials[9].title} description = {testimonials[9].description}/>

<img src ={testimonials[9].image} alt={testimonials[9].title}/>
     <Typography variant="h1" gutterBottom>
           {testimonials[9].title}
           </Typography>
        
          <div >
        <span>   <Typography variant="h2" gutterBottom>
           {testimonials[9].recommendation}
           </Typography> </span>
       
          
        </div>
          <Carousel.Caption>
        
          </Carousel.Caption>
        </Carousel.Item>
      </Carousel>
  
    </Card>
    </ThemeProvider>
  );
  }
        
   
  
  export default Testimonials;
  