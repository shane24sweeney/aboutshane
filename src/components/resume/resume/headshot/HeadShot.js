import React from "react";
import Shane from "./Shane.jpg";
import { Card, Icon, Image } from 'semantic-ui-react'



function HeadShot ()  {
  return (

  <Card centered style={{backgroundColor: 'black'}}>
    <Image src={Shane} wrapped ui={false} />
    <Card.Content >
      <Card.Header style={{color:'white'}}>
        
        <h1>Shane James Sweeney</h1>
        
        </Card.Header>
      <Card.Meta >
    
        <h1 className='date' style={{color:'white'}}>It started with a Commodore 64 in Cork, Ireland</h1>
  
      </Card.Meta>
      <Card.Description style={{color:'white'}}>
       <h1>
       Shane loves family, friends, charity work, software, dogs and running 
       </h1>
        
      </Card.Description>
    </Card.Content>
    <Card.Content extra>
      <Icon name='user' />
        Software Guru
      </Card.Content>
  </Card>

  )
  

  
};

export default HeadShot;
