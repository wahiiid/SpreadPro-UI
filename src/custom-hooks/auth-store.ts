import { create } from 'zustand'
import type Keycloak from 'keycloak-js'
import type { KeycloakProfile } from 'keycloak-js'

interface AuthState {
  keycloak: Keycloak | null
  isAuthenticated: boolean
  isLoading: boolean
  userInfo: KeycloakProfile | undefined
  setKeycloak: (keycloak: Keycloak) => void
  setAuthenticated: (isAuthenticated: boolean) => void
  setLoading: (isLoading: boolean) => void
  setUserInfo: (userInfo: Keycloak['userInfo'] | undefined) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  keycloak: null,
  isAuthenticated: false,
  isLoading: true,
  userInfo: undefined,
  setKeycloak: (keycloak) => set({ keycloak }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setLoading: (isLoading) => set({ isLoading }),
  setUserInfo: (userInfo) => set({ userInfo }),
}))
