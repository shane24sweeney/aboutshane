import Eliassen from "../resume/headshot/Eliassen.png";
import GPSTrackit from "../resume/headshot/GPSTrackit.png";
import Deluxe from "../resume/headshot/Deluxe.png";
import Celtic from "../resume/headshot/CelticTesting.png";
import BottomLine from "../resume/headshot/BottomLineTech.png";
import Ameritas from "../resume/headshot/Ameritas.png";
import Bullhorn from "../resume/headshot/bullhorn.jpeg";
import GE from "../resume/headshot/GE.png";
import Tek from "../resume/headshot/TekSystems.jpeg";


const resume = 
[
    {
        title: "TECH QA MANAGER - PRESENT",
        description: " Responsible for technical leadership in UI and API automation in GEB Groovy Spock.",
        image: Ameritas ,
    },
    {
        title: "SENIOR AUTOMATION CONTRACT ENGINEER",
        description: "Responsible for API and UI automation in GEB Groovy Spock. Utilizing the latest Page Object Design patterns."
        +" Developed over 4000 automated test cases in CI/CD in Jenkins.",
        image: Tek,
    },
    {
        title: "SENIOR AUTOMATION CONTRACT ENGINEER",
        description: "Responsible for API and UI automation in C# framework."
        +" Developed both Behavioral Driven Development (BDD) and "
          +"Test Driven Development (TDD) automation frameworks."
          +" Created automation frameworks for deployments in Azure cloud utilizing design patterns"
          +"and best practices",
        image: Eliassen,
    },

    {
        title: "SOFTWARE DEVELOPER",
        description: "Responsible for developing GPS TRACKIT product line in React, Redux"
        +" and Saga."
        +" Developed the first TDD automation framework from the ground up"
        +" at GPS TRACKIT."
        +" Created BDD Rest-Assured API calls in the automation framework"
        +"to validate API calls utilized in Postman.",
        image: GPSTrackit,
},

{
    title: "SENIOR AUTOMATION ENGINEER",
    description: "Architected and utilized design patterns to create a new "
    +"automation framework for DELUXE banking product lines. Programmed "
    +"in Java/C# and Python Robot frameworks. Performed both API and UI"
    +" automation on Business Mobile utilizing Python Robot and Java."

    +" Implemented Fluent and Dependency Injection design patterns in"
    +" multiple automation frameworks for both iOS and Android "
    +"applications.",
    image: Deluxe,
},

{
    title: "SENIOR AUTOMATION CONSULTANT",
    description: "Responsible for automating Aaron's department store in C#." 
    +" Developed multiple TDD projects for new CTE clients in Java and"
    +" Selenium. "
    +"Integrated automated testing into CI/CD pipeline in E-commerce.  ",
    image: Celtic,
},

{
    title: "SENIOR AUTOMATION ENGINEER",
    description: "Senior Test Automation Engineer for all BottomLine Healthcare product"
    +" lines."
    +" Architected the first Java Selenium WebDriver Test Driven Development"
    +"(TDD) automation framework, utilizing design patterns, best practices."
  
    +" Developed Windows automation using Java Selenium to automate the .NET"
    +"Windows LogicalInk Designer application in C#. Developed "
    +"automation scripts with JMeter for scalability testing of the REST API"
    +"interface within Logical Ink Web." ,
    image: BottomLine,
},

{
    title: "AUTOMATION ENGINEER",
    description: "Lead Java Automation Engineer for all PeopleNet product lines."
    +" Architected and designed the first Java Selenium automation framework"
    +" in PeopleNet. "
    +"Developed the first innovative automation framework for PeopleNet Time"
    +"entry." ,
    image: Bullhorn,
},
{
    title: "LEAD ENGINEER/TECHNOLOGIST",
    description: "Lead Engineer for all AMI meter products in both IEC and ANSI meter"
    +" products. Responsible for managing and mentoring other employees"
    +" with in Digital meters. Developed the first automation framework"
    +" for meters. Developed and executed software test plans, test designs,"
    +" test objectives, and test cases. " ,
    image: GE,
}
]

export default resume