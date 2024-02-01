import React from "react";
import { Form, Input, TextArea, Button } from "semantic-ui-react";
import "./email.css";
import Swal from "sweetalert2";
import emailjs from "emailjs-com";


const SERVICE_ID = "service_p5dpxp5";
const TEMPLATE_ID = "template_ye4bn4a";

const USER_ID = "user_dheSXAbJ2Qf4yl2w7Fj62";


function Email () {
  const handleOnSubmit = (e) => {
    e.preventDefault();
    emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, e.target, USER_ID)
      .then((result) => {
        console.log(result.text);
        Swal.fire({
          icon: "success",
          title: "Message Sent Successfully"
        })
      }, (error) => {
        console.log(error.text);
        Swal.fire({
          icon: "error",
          title: "Ooops, something went wrong",
          text: error.text,
        })
      });
    e.target.reset()
  };
return (

  <div className="Header"
  style={{
    height: '100%',
    padding: '60px', 
    borderRadius: '10px',
    borderColor: 'blue',
    color:'white',
    display: 'flex'
}}
  >
    
      
  
    <div className="Email"
  
    
    >
      <Form onSubmit={handleOnSubmit}>
        <Form.Field
          id="form-input-control-email"
          control={Input}
          label="Email"
          name="user_email"
          placeholder="Email"
          required
          icon="mail"
          iconPosition="left"
        />
        <Form.Field
          id="form-input-control-last-name"
          control={Input}
          label="Name"
          name="user_name"
          placeholder="Name"
          required
          icon="user circle"
          iconPosition="left"
        />
        <Form.Field
          id="form-textarea-control-opinion"
          control={TextArea}
          label="Message"
          name="user_message"
          placeholder="Message"
          required
          icon="user circle"
          iconPosition="left"
         
        />
        <Button type="submit" color="green">Submit</Button>
      </Form>
      </div>
    </div>
  
  );
}

export default Email