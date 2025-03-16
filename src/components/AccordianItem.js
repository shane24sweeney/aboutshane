import React, { useRef } from 'react';
import { RiArrowDropDownLine } from 'react-icons/ri';
const AccordionItem = ({ image, title, description, isOpen, onClick }) => {
 const contentHeight = useRef()
  return(
    <div className="wrapper" >
    <button className={`question-container ${isOpen ? 'active' : ''}`} onClick={onClick} >
    <img src ={image} alt={title}/>
     <p className='question-content'>{title}</p>
     <RiArrowDropDownLine className={`arrow ${isOpen ? 'active' : ''}`} /> 
    </button>

     <div ref={contentHeight} className="answer-container" style={
          isOpen
          ? { height: contentHeight.current.scrollHeight }
          : { height: "0px" }
         }>
      <p className="answer-container">{description}</p>
     </div>
   </div>
  )
}

export default AccordionItem;