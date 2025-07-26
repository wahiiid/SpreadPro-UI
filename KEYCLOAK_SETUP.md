# Keycloak Integration Setup

This project uses Keycloak for authentication. Follow these steps to set up Keycloak:

## 1. Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Keycloak Configuration
VITE_KEYCLOAK_URL=http://localhost:5173
VITE_KEYCLOAK_REALM=your-realm
VITE_KEYCLOAK_CLIENT_ID=your-client-id

# API Configuration
VITE_API_BASE_URL=https://spreadpro.nablainfotech.com
```

## 2. Keycloak Server Setup

1. Install and start Keycloak server
2. Create a new realm or use an existing one
3. Create a new client with the following settings:
   - Client ID: `your-client-id`
   - Client Protocol: `openid-connect`
   - Access Type: `public`
   - Valid Redirect URIs: `http://localhost:5173/*`
   - Web Origins: `http://localhost:5173`

## 3. Features

- **Automatic Token Refresh**: Tokens are automatically refreshed when they're about to expire
- **Bearer Token Authentication**: All API requests include the bearer token
- **Loading States**: Shows loading screen while Keycloak initializes
- **Error Handling**: Proper error handling for authentication failures
- **User Info**: Displays username in the header
- **Logout**: Logout button in the header

## 4. API Integration

All API requests automatically include the bearer token in the Authorization header. The token is refreshed automatically when needed.

## 5. Troubleshooting

- Make sure Keycloak server is running
- Check that environment variables are correctly set
- Verify client configuration in Keycloak admin console
- Check browser console for any authentication errors
