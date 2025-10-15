import React from 'react'

const Header = () => {
  return (
    <div 
      className='relative min-h-screen  bg-cover bg-center flex items-center w-full overflow-hidden' 
      style={{backgroundImage: "url('/landpage-background.png')"}} 
      id='Header'
    > 
     

      {/* Hero Content */}
      <div className="relative z-10 w-full px-6 md:px-12 lg:px-20 text-center py-24 md:py-32">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-white font-inria font-bold text-5xl sm:6xl md:text-[59px] leading-tight mb-6 uppercase tracking-tight">
            Legal Solutions for Business <br className="block" />
            and Individual Needs
          </h1>
          <p className="text-white/90 font-inria text-2xl sm:3xl md:text-[18px]  max-w-3xl mx-auto leading-relaxed">
            Explore laws, find trusted lawyers, and get expert legal consultations online.
          </p>
          
          {/* Optional CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-brownBG hover:bg-brownforhover text-white font-inria font-semibold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
              Get Consultation
            </button>
            <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-inria font-semibold px-8 py-3 rounded-lg border-2 border-white/30 transition-all duration-300">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 50px, rgba(255,255,255,0.1) 50px, rgba(255,255,255,0.1) 100px)'
        }}></div>
      </div>
    </div>
  )
}

export default Header