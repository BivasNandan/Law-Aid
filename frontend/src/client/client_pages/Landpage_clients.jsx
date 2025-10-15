import React from 'react'
import Navbar from "../../common/Navbar"
import Header from '../../common/Header'
import About from '../../common/About'
import Services from '../client_components/Services'
import Footer from '../../common/Footer'

const Landpage = () => {
  return (
    <div >
      <Navbar/>
      <Header/>
      <Services/>
      <About/>
      <Footer/>
    </div>
  )
}


export default Landpage