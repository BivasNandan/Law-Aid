import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import law from '../../assets/law.png'
import lawyer from '../../assets/lawyer.png'
import consultation from '../../assets/consultation.png'
import { Appcontext } from '../../lib/Appcontext'
import axios from '../../lib/axiosConfig'


const Services = () => {
  const navigate = useNavigate();
  const { userData } = useContext(Appcontext)
  const [loadingId, setLoadingId] = useState(null)

  const services = [
  {
    id: 1,
    image: consultation,
    alt: "Legal Consultation",
    title: "Legal Consultation",
    description: "Get expert legal advice from our legal experts in various fields of law.",
    route: "/consultation-chat",
    // special: open conversation with admin
    openWithAdmin: true
  },
  {
    id: 2,
    image: lawyer,
    alt: "Find a Lawyer",
    title: "Find a Lawyer",
    description: "Search and connect with trusted lawyers based on your legal needs and location.",
    route: "/find-lawyer"  
  },
  {
    id: 3,
    image: law,
    alt: "View Laws & Regulations",
    title: "View Laws & Regulations",
    description: "Access a comprehensive database of laws, regulations, and legal codes in Bangladesh.",
    route: "/ViewLaw"  
  }
];

  return (
    <div className='bg-creamcolor py-10 sm:py-16 md:py-20' id='Services'>
        {/* Title Section */}
        <div className='container mx-auto px-4 sm:px-6 md:px-12 lg:px-20 xl:px-32'>
            <h1 className='text-browntextcolor text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-8 sm:mb-10 md:mb-12 text-center'>Our Services</h1>
        </div>
        
        {/* Services Grid */}
        <div className='container mx-auto px-4 sm:px-6 md:px-12 lg:px-20 xl:px-32'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8'>
                {services.map((service) => (
                  <div 
                    key={service.id}
                    onClick={async () => {
                      if (service.openWithAdmin) {
                        // ensure user is logged in
                        if (!userData) { navigate('/login'); return }
                        try {
                          setLoadingId(service.id)
                          const res = await axios.post(`/api/chat/conversation/admin`)
                          const conv = res.data
                          if (conv && conv._id) navigate(`/consultation-chat?conversationId=${conv._id}`)
                          else navigate(service.route)
                        } catch (err) {
                          console.error('Failed to start admin consultation', err)
                          navigate(service.route)
                        } finally {
                          setLoadingId(null)
                        }
                      } else {
                        navigate(service.route)
                      }
                    }}
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

export default Services