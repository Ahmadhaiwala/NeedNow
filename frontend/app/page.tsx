import Image from "next/image";
import SignInPage from "./authentication/Signout";
import {ClerkProvider}  from "@clerk/nextjs"
import Layout from "./layout/Layout";

export default function Home() {
  return (
    <div className="">
      <ClerkProvider>
        <Layout/>



        
      </ClerkProvider>
       
    </div>
    
   
  );
}
