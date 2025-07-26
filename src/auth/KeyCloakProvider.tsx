import { useEffect } from 'react'
import Keycloak from 'keycloak-js'
import { toast } from 'sonner'
import { useAuthStore } from '@/custom-hooks/auth-store'
import { LoadingScreen } from '@/components/LoadingScreen'

const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'https://keycloak.nablainfotech.com',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'NablaGenAI',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'spreadpro-ui',
}

export default function KeycloakProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { setKeycloak, setAuthenticated, setLoading, setUserInfo, isLoading } =
    useAuthStore()

  // Check if we're in development mode and Keycloak is not configured
  const isDevelopment = import.meta.env.DEV;
  const isKeycloakConfigured = keycloakConfig.url && keycloakConfig.url !== 'undefined';

  // If in development and Keycloak is not configured, skip authentication
  if (isDevelopment && !isKeycloakConfigured) {
    console.warn('Keycloak not configured in development mode. Skipping authentication.');
    setLoading(false);
    setAuthenticated(true); // Allow access without authentication in dev
    return <>{children}</>;
  }

  const keycloak = new Keycloak(keycloakConfig)

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        // Check if Keycloak is properly configured
        if (!keycloakConfig.url || keycloakConfig.url === 'undefined') {
          console.error('Keycloak URL is not configured. Please set VITE_KEYCLOAK_URL in your .env file.');
          setLoading(false);
          setAuthenticated(false);
          toast.error('Keycloak configuration is missing. Please check your environment variables.');
          return;
        }

        const authenticated = await keycloak.init({
          onLoad: 'login-required',
          pkceMethod: 'S256',
          checkLoginIframe: false,
        })

        if (authenticated) {
          setKeycloak(keycloak)
          setAuthenticated(true)

          // Fetch user info and store in global state
          try {
            const userInfo = await keycloak.loadUserProfile()
            setUserInfo(userInfo)
          } catch (error) {
            console.warn('Failed to load user profile:', error);
            setUserInfo(undefined)
          }

          // Check if this is a first-time login by looking at the token
          const token = keycloak.token
          if (!token) {
            // No token means this is a fresh login
            toast.success('Welcome! You have been successfully logged in.')
          }
        }
        setLoading(false)
      } catch (error) {
        console.error('Keycloak initialization failed:', error);
        setLoading(false)
        setAuthenticated(false)
        toast.error('Authentication failed. Please try again.')
      }
    }

    initKeycloak()
  }, [setKeycloak, setAuthenticated, setLoading, setUserInfo])

  // Show loading screen while Keycloak is initializing
  if (isLoading) {
    return <LoadingScreen message="Initializing authentication..." />
  }

  return <>{children}</>
}
