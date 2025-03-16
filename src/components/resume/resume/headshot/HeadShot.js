import React from "react";
import Shane from "./Shane.jpg";
import { Card, Image } from 'semantic-ui-react'
import { ThemeProvider, createTheme } from '@material-ui/core/styles';

const theme = createTheme({
  typography: {
    fontSize: "1px",
    fontFamily: [
      'Raleway', 'sans-serif',
      
    ].join(','),
  },});


function HeadShot ()  {
  return (
<ThemeProvider theme={theme}  style={{
      height: '100vh',
      width: '100%',
      padding: '1px', 
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
  }} >
  <Card centered style={{
      height: '100vh',
      width: '100%',
      padding: '1px', 
      backgroundColor: 'black',
      color:'white',
      display: 'flex'
  }}>
    <Image src={Shane} wrapped ui={false} />
    <Card.Content >
      <Card.Header style={{color:'white'}}>
        
        <h1>Shane James Sweeney</h1>
        
        </Card.Header>
      <Card.Meta >
    
        <h3 className='date' style={{color:'white'}}>It started with a Commodore 64 in Cork, Ireland</h3>
  
      </Card.Meta>
      <Card.Description style={{color:'white'}}>
       <h3>
       Shane loves family, friends, charity work, software, dogs and running 
       </h3>
        
      </Card.Description>
    </Card.Content>
    <Card.Content extra style={{color:'white'}}>
        <h3>Software Guru</h3>
      </Card.Content>
  </Card>
</ThemeProvider>
  )
  

  
};

export default HeadShot;
