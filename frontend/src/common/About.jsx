import React from 'react'
import Aboutpic from "../assets/aboutus.jpg"

const About = () => {
  return (
    <div className='flex flex-col items-center justify-center 
    container bg-AboutBackgroudColor mx-auto p-14 md:px-20 lg:px-32 w-full sm:3xl overflow-hidden' id='About' >
      <h1 className='text-browntextcolor text-2xl sm:text-4xl font-bold mb-8'>About Us</h1>
      
      {/* Horizontal Layout Container */}
      <div className='flex flex-col md:flex-row  items-center  md:items-start md:gap-12'>
        
        {/* Left Side - Image */}
        <div className='w-full md:w-1/4 flex justify-center'>
          <img 
            src={Aboutpic}  
            alt="Law Aid About Us" 
            className='w-full rounded-lg shadow-lg object-cover'
            style={{ height: '20.5rem' }}
          />
        </div>
          
        {/* Right Side - Text Content */}
        <div className='w-full md:w-3/4 flex flex-col gap-6'>
          <p className='text-browntextcolor text-base leading-relaxed max-w-prose text-justify'>
            Law_Aid is a Bangla-first legal support platform designed to make law simple, accessible, and understandable for everyone in Bangladesh.We believe that legal help should not be limited to big cities or expensive consultations — it should reach every citizen, no matter where they live.
            Our mission is to bridge the gap between people and the legal system by providing verified lawyer connections, easy-to-read legal codes, and practical guidance in both Bangla and English.Through Law_Aid, users can search for lawyers, ask legal questions, book consultations, and learn about their rights — all from one trusted platform.
            We are committed to building awareness, ensuring transparency, and empowering people with the knowledge they need to stand up for their rights.Whether you are looking for legal advice, understanding your case, or just learning about the law — Law_Aid is here to help you every step of the way.
          </p>
        </div>
        
      </div>
    
    </div>
  )
}

export default About