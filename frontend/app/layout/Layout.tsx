import { ReactNode } from "react"
import Navbar from "../navbar/Navbar"

export default function Layout({children}:{children : React.ReactNode}){
    return(
         <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-page)' }}>
            <Navbar/>
            {/* pt-20 accounts for floating navbar height (56px) + top padding (12px*2) */}
            <div className="pt-20 flex-grow">
               {children}
            </div>
    </div>
    )
}