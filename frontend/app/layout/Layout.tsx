'use client';

import Navbar from "../navbar/Navbar"
import { CartProvider } from "@/context/CartContext"

// Import cache debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  import('@/lib/cache-debug');
}

export default function Layout({children}:{children : React.ReactNode}){
    return(
         <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-page)' }}>
              <CartProvider>
                <Navbar/>
                {/* pt-[120px] accounts for floating navbar height (76px) + top padding (24px) + gap */}
                <div className="pt-[120px] flex-grow">
                   {children}
                </div>
              </CartProvider>
         </div>
    )
}