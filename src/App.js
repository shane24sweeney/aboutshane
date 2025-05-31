import './App.css';
import React from "react";
import "./App.css";
import education from "./components/education/education"
import HeadShot from "./components/resume/resume/headshot/HeadShot";
import about from "./components/about/About";
import AccordionComponent from "./components/accordian/index.js";
import testimonials from "./components/testimonials/testimonials/Testimonials";
import Email from "./components/email/index.js";
import Charity from "./components/resume/resume/headshot/Charity";
import "./App.css";
import Navigation from './components/navigation/index.js';
import { BrowserRouter, Route, Switch, Redirect } from "react-router-dom";

function App(){

  return (
          <div className="responsive">
            <div className="box">

          <BrowserRouter>
          <Navigation />
          <Switch>
             <Route path="/home" component={HeadShot} exact/>
             <Route exact path="/"><Redirect to="/home" /></Route>
             <Route path="/about" component={about}/>
             <Route path="/contact" component={Email}/>
             <Route path="/resume" component={AccordionComponent}/>
             <Route path="/testimonials" component={testimonials}/>
             <Route path="/education" component={education}/>
             <Route path="/Charity" component={Charity}/>



           </Switch>
          </BrowserRouter>

          </div>

              </div>


            );


          } 




export default App;
