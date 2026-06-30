import { ReactNode } from "react"
import Navbar from "../navbar/Navbar"

export default function Layout({children}:{children : React.ReactNode}){
    return(
         <div className="min-h-screen flex flex-col">
            <Navbar/>
            <div className="pt-16 flex-grow">
               {children}
            </div>
    </div>
    )
}