import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ConfigurationProvider } from './contexts/ConfigurationContext';
import KeycloakProvider from './auth/KeyCloakProvider';
import './index.css';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Create a new router instance
const router = createRouter({
  routeTree,
  basepath: '/spreadpro'
});

// Create a new query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
    },
  },
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <KeycloakProvider>
      <QueryClientProvider client={queryClient}>
        <ConfigurationProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" />
        </ConfigurationProvider>
      </QueryClientProvider>
    </KeycloakProvider>
  </StrictMode>
);
