import React, { useState } from 'react';
import AccordionItem from './AccordianItem';
import resume from '../resume/resume/resume';
import './Accordian.css';
const Accordion = () => {

    const [activeIndex, setActiveIndex] = useState(null);

    const handleItemClick = (index) => {
     setActiveIndex((prevIndex) => (prevIndex === index ? null : index));
    };

    return (
     <div className='container'>
       {resume.map((item, index) => (
       <AccordionItem
       sx={{
        position: 'fixed',
        bottom: 0,
      }}
        key={index}
        title={item.title}
        image = {item.image}
        description={item.description}
        isOpen={activeIndex === index}
        onClick={() => handleItemClick(index)}
       />
      ))}
     </div>
    )
   };

   export default Accordion;
