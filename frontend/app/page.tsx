import Image from "next/image";
import SignInPage from "./authentication/Signout";
import {ClerkProvider}  from "@clerk/nextjs"

export default function Home() {
  return (
    <div className="">
      <ClerkProvider>
       
      </ClerkProvider>
       
    </div>
    
   
  );
}
