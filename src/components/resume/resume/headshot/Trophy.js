import React from "react";
import Spotlight from "rc-spotlight";
import Tropies from "../resume/resume/headshot/Tropies.png";
import { Card,  Image } from 'semantic-ui-react'
import styled from "styled-components";







function Trophy () {
  return (
  
  <div className="justify-content-center" centered style={{backgroundColor: 'black'}}>
    
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
          <Image src={Tropies} wrapped ui={true} />
   </div>
      
    

 
  
    
      
    
 
  )
  

  
};

export default Trophy;
