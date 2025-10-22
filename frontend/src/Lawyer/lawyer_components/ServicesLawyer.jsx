import React from 'react'
import { useNavigate } from 'react-router-dom'
import law from '../../assets/law.png'
import Schedule from '../../assets/Schedule.png'

const ServicesLawyer = () => {
  const navigate = useNavigate();

  const services = [
  {
    id: 1,
    image: law,
    alt: "View Laws & Regulations",
    title: "View Laws & Regulations",
    description: "Access a comprehensive database of laws, regulations, and legal codes in Bangladesh.",
    route: "/view-manage-law"  
  },
  {
    id: 2,
    image:Schedule,
    alt: "Manage Appointments",
    title: "Manage Appointments",
    description: "Easily schedule, view, and manage your client appointments all in one place.",
    route: "/manage-appointments"

  }
];
return (
    <div className='bg-creamcolor py-10 sm:py-16 md:py-20' id='ServicesLawyer'>
        {/* Title Section */}
  <div className='container mx-auto px-8 sm:px-10 md:px-16 lg:px-28 xl:px-40'>
            <h1 className='text-browntextcolor text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-8 sm:mb-10 md:mb-12 text-center'>Our Services</h1>
        </div>
        
        {/* Services Grid */}
        <div className='container mx-auto px-4 sm:px-6 md:px-12 lg:px-20 xl:px-32'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 md:gap-12'>
                {services.map((service) => (
                  <div 
                    key={service.id}
                    onClick={() => navigate(service.route)}
                    className='bg-[#F7F2EC] rounded-lg shadow-lg overflow-hidden cursor-pointer group hover:shadow-2xl transition-all duration-300 flex flex-col'
                  >
                    {/* Image Section */}
                    <div className='overflow-hidden'>
                      <img 
                        src={service.image} 
                        alt={service.alt} 
                        className='w-full h-48 sm:h-52 md:h-56 lg:h-64 object-cover group-hover:scale-110 transition-transform duration-300' 
                      />
                    </div>
                    
                    {/* Text Content Section */}
                    <div className='p-4 sm:p-5 md:p-6 flex-grow flex flex-col'>
                      <h2 className='text-browntextcolor text-lg sm:text-xl md:text-xl font-bold mb-2 sm:mb-3 group-hover:text-brownforhover transition-colors duration-300'>
                        {service.title}
                      </h2>
                      <p className='text-browntextcolor-600 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 flex-grow'>
                        {service.description}
                      </p>
                      <p className='text-browntextcolors-500 text-xs'>
                        Click to learn more
                      </p>
                      
                    </div>
                  </div>
                ))}
            </div>
        </div>      
    </div>
  )
}
export default ServicesLawyer
    