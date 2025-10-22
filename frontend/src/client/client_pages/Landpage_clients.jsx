import React, { useContext } from 'react'
import Navbar from "../../common/Navbar"
import Header from '../../common/Header'
import About from '../../common/About'
import Services from '../client_components/Services'
import ServicesLawyer from '../../Lawyer/lawyer_components/ServicesLawyer'
import Footer from '../../common/Footer'
import { Appcontext } from '../../lib/Appcontext'

const Landpage = () => {
  const { userData } = useContext(Appcontext)

  return (
    <div >
      <Navbar/>
      <Header/>
      {userData?.role === 'lawyer' ? <ServicesLawyer/> : <Services/>}
      <About/>
      <Footer/>
    </div>
  )
}

export default Landpage