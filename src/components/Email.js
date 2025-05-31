import React from "react";
import "./email.css";
import emailjs from "emailjs-com";



const SERVICE_ID = "service_p5dpxp5";
const TEMPLATE_ID = "template_ye4bn4a";
const PUBLIC_KEY = "user_dheSXAbJ2Qf4yl2w7Fj62";


const Email = () => {
  const handleOnSubmit = (e) => {
      e.preventDefault();
      emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, e.target, PUBLIC_KEY)
        .then((result) => {
          console.log(result.text);
          alert('Message Sent Successfully')
        }, (error) => {
          console.log(error.text);
          alert('Something went wrong!')
        });
      e.target.reset()
    };
  return (
      <div style={{width:'100vw', 
      height: '100vh', 
      display:'flex',
      margin: '20px',
      justifyContent:'center',
      alignItems:'center',
      border: '1px',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 0 10px 0 rgba(0,0,0,0.1)',
      backgroundColor: 'black' 
      }}>
          <form class="formContainer" onSubmit={handleOnSubmit}>
              <h2>Send me a message. Let's have a chat!</h2>
              <div class="formElement">
                  <label for="from_name">Name</label>
                  <input type="text" id="from_name" name="from_name" placeholder="Your name.." required />
              </div>

              <div class="formElement">
                  <label>E-mail</label>
                  <input type="email" id="from_email" name="from_email" placeholder="Your email.." required />
              </div>

              <div class="formElement">
                  <label for="message">Message</label>
                  <textarea name="message" rows="8" cols="30" placeholder="Your message.." required />
              </div>
              <button type='submit' className='formButton'>Submit</button>
          </form>
      </div>
  )
}
export default Email

