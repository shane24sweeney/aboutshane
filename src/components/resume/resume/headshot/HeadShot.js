import React from "react";
import Shane from "./Shane.jpg";
import { Card, Icon, Image } from 'semantic-ui-react'



function HeadShot ()  {
  return (

  <Card centered>
    <Image src={Shane} wrapped ui={false} />
    <Card.Content >
      <Card.Header>Shane James Sweeney</Card.Header>
      <Card.Meta >
    
        <span className='date'>It started with a Commodore 64 in Cork, Ireland</span>
  
      </Card.Meta>
      <Card.Description>
       
        Shane loves family, friends, charity work, software, dogs and running 
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
