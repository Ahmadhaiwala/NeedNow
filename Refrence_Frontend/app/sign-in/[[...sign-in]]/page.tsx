'use client'

import { SignIn } from '@clerk/nextjs'
import { motion } from 'framer-motion'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-beige flex items-center justify-center pt-20 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <SignIn
          appearance={{
            baseTheme: 'light',
            elements: {
              rootBox: 'w-full',
              card: 'bg-white rounded-2xl shadow-lg',
              headerTitle: 'text-navy font-bold text-2xl',
              formButtonPrimary: 'bg-green hover:bg-opacity-90 rounded-lg text-white',
              formFieldInput: 'border border-sky-blue rounded-lg',
              footerActionLink: 'text-green hover:text-navy',
            },
          }}
          redirectUrl="/chat"
        />
      </motion.div>
    </div>
  )
}
