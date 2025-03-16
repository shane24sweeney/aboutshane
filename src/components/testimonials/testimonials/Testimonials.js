import React from 'react';
import Carousel from 'react-bootstrap/Carousel';
import  "../testimonials.css";
import { Card } from 'semantic-ui-react';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
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
   <div className="container">
      <ThemeProvider theme={theme}  style={{
      height: '100vh',
      padding: '1px', 
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
  }} >
      <Card    
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
         <testimonials image={testimonials[0].image} title={testimonials[0].title} description = {testimonials[0].description}/>

           
            <img src ={testimonials[0].image} alt={testimonials[0].title}/>
           
           
            <p>
               </p>
               <div>
               <h3>
               {testimonials[0].name}
                  </h3>
               <h4>
               {testimonials[0].title}
                  </h4>
         
           
        
          <div >
        <span>   
         <p>
         {testimonials[0].recommendation}
            </p>
     
            </span>
       
          
        </div>
      
        </div> 
      
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[1].image} centered title={testimonials[1].title} description = {testimonials[0].description}/>

<img src ={testimonials[1].image} alt={testimonials[1].title}/>
<p>
               </p>
               <div>
               <h3>
               {testimonials[1].name}
                  </h3>
               <h4>
               {testimonials[1].title}
                  </h4>
         
           
        
          <div >
        <span>   
         <p>
         {testimonials[1].recommendation}
            </p>
     
            </span>
       
          
        </div>
      
        </div> 
  
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[2].image} title={testimonials[2].title} description = {testimonials[2].description}/>

        <img src ={testimonials[2].image} alt={testimonials[2].title}/>
        <p>
               </p>
               <div>
               <h3>
               {testimonials[2].name}
                  </h3>
               <h4>
               {testimonials[2].title}
                  </h4>
         
           
        
          <div >
        <span>   
         <p>
         {testimonials[2].recommendation}
            </p>
     
            </span>
       
          
        </div>
      
        </div> 
       
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[3].image} title={testimonials[3].title} description = {testimonials[3].description}/>

<img src ={testimonials[3].image} alt={testimonials[3].title}/>
<p>
               </p>
               <div>
               <h3>
               {testimonials[3].name}
                  </h3>
               <h4>
               {testimonials[3].title}
                  </h4>
         
           
        
          <div >
        <span>   
         <p>
         {testimonials[3].recommendation}
            </p>
     
            </span>
       
          
        </div>
      
        </div> 
      
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[4].image} title={testimonials[4].title} description = {testimonials[4].description}/>

<img src ={testimonials[4].image} alt={testimonials[4].title}/>
<p>
               </p>
               <div>
               <h3>
               {testimonials[4].name}
                  </h3>
               <h4>
               {testimonials[4].title}
                  </h4>
         
           
        
          <div >
        <span>   
         <p>
         {testimonials[4].recommendation}
            </p>
     
            </span>
       
          
        </div>
      
        </div> 
        
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[5].image} title={testimonials[5].title} description = {testimonials[5].description}/>

<img src ={testimonials[5].image} alt={testimonials[5].title}/>
<p>
               </p>
               <div>
               <h3>
               {testimonials[5].name}
                  </h3>
               <h4>
               {testimonials[5].title}
                  </h4>
         
           
        
          <div >
        <span>   
         <p>
         {testimonials[5].recommendation}
            </p>
     
            </span>
       
          
        </div>
      
        </div> 
       
        </Carousel.Item>
        <Carousel.Item interval={4000}>
       
          
        <p>
               </p>
               <div>
               <h3>
               {testimonials[6].name}
                  </h3>
               <h4>
               {testimonials[6].title}
                  </h4>
         
           
        
          <div >
        <span>   
         <p>
         {testimonials[6].recommendation}
            </p>
     
            </span>
       
          
        </div>
      
        </div> 
        
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[7].image} title={testimonials[7].title} description = {testimonials[7].description}/>

<img src ={testimonials[7].image} alt={testimonials[7].title}/>
<p>
               </p>
               <div>
               <h3>
               {testimonials[7].name}
                  </h3>
               <h4>
               {testimonials[7].title}
                  </h4>
         
           
        
          <div >
        <span>   
         <p>
         {testimonials[7].recommendation}
            </p>
     
            </span>
       
          
        </div>
      
        </div> 
         
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[8].image} title={testimonials[8].title} description = {testimonials[8].description}/>

<img src ={testimonials[8].image} alt={testimonials[8].title}/>
<p>
               </p>
               <div>
               <h3>
               {testimonials[8].name}
                  </h3>
               <h4>
               {testimonials[8].title}
                  </h4>
         
           
        
          <div >
        <span>   
         <p>
         {testimonials[8].recommendation}
            </p>
     
            </span>
       
          
        </div>
      
        </div> 
         
        </Carousel.Item>
        <Carousel.Item interval={4000}>
        <testimonials image={testimonials[9].image} title={testimonials[9].title} description = {testimonials[9].description}/>

<img src ={testimonials[9].image} alt={testimonials[9].title}/>
<p>
               </p>
               <div>
               <h3>
               {testimonials[9].name}
                  </h3>
               <h4>
               {testimonials[9].title}
                  </h4>
         
           
        
          <div >
        <span>   
         <p>
         {testimonials[9].recommendation}
            </p>
     
            </span>
       
          
        </div>
      
        </div> 
         
        </Carousel.Item>
      </Carousel>
  
    </Card>
    </ThemeProvider>
      </div>
  );
 
  }
        
   
  
  export default Testimonials;
  