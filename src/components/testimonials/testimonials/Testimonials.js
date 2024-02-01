import React, { useState } from 'react';
import Carousel from 'react-bootstrap/Carousel';
import  "../testimonials.css";
import { Card } from 'semantic-ui-react';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import testimonials from "../testimonials";



const theme = createTheme({
    typography: {
      fontSize: "1px",
      fontFamily: [
        'Raleway', 'sans-serif',
        
      ].join(','),
    },});
  
   
  
  function Testimonials()  {
  
     
   
return (
      <ThemeProvider theme={theme}  >
      <Card    
      style={{
          height: '100%',
          padding: '60px', 
          borderRadius: '10px',
          backgroundColor: 'black',
          color:'white',
          display: 'flex'
      }}
  >
      
          
             
      
      <Carousel controls={false} indicators={false}>
        <Carousel.Item interval={4000} 
      >
         <testimonials image={testimonials[0].image} title={testimonials[0].title} description = {testimonials[0].description}/>

            <img src ={testimonials[0].image} alt={testimonials[0].title}/>
           
           <Typography>
           {testimonials[0].title}
           </Typography>
        
          <div >
        <span>   <Typography>
       {testimonials[0].recommendation}
           </Typography> </span>
       
          
        </div>
      
           
      
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[1].image} centered title={testimonials[1].title} description = {testimonials[0].description}/>

<img src ={testimonials[1].image} alt={testimonials[1].title}/>
       <Typography>
       {testimonials[1].title}
                     
           </Typography>
        
          <div >
        <span>   <Typography>
      
                    
        {testimonials[1].recommendation}
                     
                 
           </Typography> </span>
       
          
        </div>
  
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[2].image} title={testimonials[2].title} description = {testimonials[2].description}/>

        <img src ={testimonials[2].image} alt={testimonials[2].title}/>
        <Typography>
           {testimonials[2].title}
           </Typography>
        
          <div >
        <span>   <Typography>
           {testimonials[2].recommendation}
           </Typography> </span>
       
          
        </div>
       
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[3].image} title={testimonials[3].title} description = {testimonials[3].description}/>

<img src ={testimonials[3].image} alt={testimonials[3].title}/>
       <Typography>
           {testimonials[3].title}
           </Typography>
        
          <div >
        <span>   <Typography>
           {testimonials[3].recommendation}
           </Typography> </span>
       
          
        </div>
      
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[4].image} title={testimonials[4].title} description = {testimonials[4].description}/>

<img src ={testimonials[4].image} alt={testimonials[4].title}/>
       <Typography>
           {testimonials[4].title}
           </Typography>
        
          <div >
        <span>   <Typography>
           {testimonials[4].recommendation}
           </Typography> </span>
       
          
        </div>
        
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[5].image} title={testimonials[5].title} description = {testimonials[5].description}/>

<img src ={testimonials[5].image} alt={testimonials[5].title}/>
      <Typography>
           {testimonials[5].title}
           </Typography>
        
          <div >
        <span>   <Typography>
           {testimonials[5].recommendation}
           </Typography> </span>
       
          
        </div>
       
        </Carousel.Item>
        <Carousel.Item interval={4000}>
       
          
        <Typography>
           {testimonials[6].title}
           </Typography>
        
          <div >
        <span>   <Typography>
           {testimonials[6].recommendation}
           </Typography> </span>
       
          
        </div>
        
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[7].image} title={testimonials[7].title} description = {testimonials[7].description}/>

<img src ={testimonials[7].image} alt={testimonials[7].title}/>
      <Typography>
           {testimonials[7].title}
           </Typography>
        
          <div >
        <span>   <Typography>
           {testimonials[7].recommendation}
           </Typography> </span>
       
          
        </div>
         
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[8].image} title={testimonials[8].title} description = {testimonials[8].description}/>

<img src ={testimonials[8].image} alt={testimonials[8].title}/>
      <Typography>
           {testimonials[8].title}
           </Typography>
        
          <div >
        <span>   <Typography>
           {testimonials[8].recommendation}
           </Typography> </span>
       
          
        </div>
         
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[9].image} title={testimonials[9].title} description = {testimonials[9].description}/>

<img src ={testimonials[9].image} alt={testimonials[9].title}/>
     <Typography>
           {testimonials[9].title}
           </Typography>
        
          <div >
        <span>   <Typography>
           {testimonials[9].recommendation}
           </Typography> </span>
       
          
        </div>
         
        </Carousel.Item>
      </Carousel>
  
    </Card>
    </ThemeProvider>
  );
  }
        
   
  
  export default Testimonials;
  