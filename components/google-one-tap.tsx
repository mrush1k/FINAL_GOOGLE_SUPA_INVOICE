'use client'

import Script from 'next/script'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface CredentialResponse {
  credential: string
  select_by?: string
}

interface GoogleAccounts {
  id: {
    initialize: (config: any) => void
    prompt: () => void
  }
}

declare const google: { accounts: GoogleAccounts }

// generate nonce to use for google id token sign-in
const generateNonce = async (): Promise<string[]> => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  const nonce = btoa(Array.from(array, byte => String.fromCharCode(byte)).join(''))
  
  const encoder = new TextEncoder()
  const encodedNonce = encoder.encode(nonce)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  return [nonce, hashedNonce]
}

const OneTapComponent = () => {
  const supabase = createClient()
  const router = useRouter()

  const initializeGoogleOneTap = () => {
    console.log('Initializing Google One Tap')
    
    // Use async IIFE to handle async operations
    ;(async () => {
      try {
        const [nonce, hashedNonce] = await generateNonce()
        console.log('Nonce generated')

        // check if there's already an existing session before initializing the one-tap UI
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session', error)
        }
        if (data.session) {
          router.push('/dashboard')
          return
        }

        /* global google */
        google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          callback: async (response: CredentialResponse) => {
            try {
              // send id token returned in response.credential to supabase
              const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
                nonce,
              })

              if (error) throw error
              console.log('Session data: ', data)
              console.log('Successfully logged in with Google One Tap')

              // redirect to protected page
              router.push('/dashboard')
            } catch (error) {
              console.error('Error logging in with Google One Tap', error)
            }
          },
          nonce: hashedNonce,
          // with chrome's removal of third-party cookies, we need to use FedCM instead
          use_fedcm_for_prompt: true,
        })
        google.accounts.id.prompt() // Display the One Tap UI
      } catch (error) {
        console.error('Error initializing Google One Tap:', error)
      }
    })()
  }

  return <Script onReady={initializeGoogleOneTap} src="https://accounts.google.com/gsi/client" />
}

export default OneTapComponent
