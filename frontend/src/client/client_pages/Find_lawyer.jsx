import React from 'react'
import Navbar from "../../common/Navbar"
import SearchLawyer from '../client_components/findLawyer/SearchLawyer'
import Footer from '../../common/Footer'

const FindLawyer = () => {
    return (
        <div>
          <Navbar />
          <SearchLawyer />
          <Footer />
        </div>
      )
    }

export default FindLawyer;