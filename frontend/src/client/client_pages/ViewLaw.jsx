import React from 'react'
import Navbar from "../../common/Navbar"
import SearchLaw from '../client_components/findLaw/Searchlaw'
import Footer from '../../common/Footer'

const ViewLaw = () => {
    return (
        <div>
          <Navbar />
          <SearchLaw />
          <Footer />
        </div>
      )
    }

export default ViewLaw;