import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import ClerkSetupNotice from './components/ClerkSetupNotice';
import './index.css';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {clerkPublishableKey ? (
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        signInFallbackRedirectUrl="/"
        signUpFallbackRedirectUrl="/"
        signInForceRedirectUrl="/"
        signUpForceRedirectUrl="/"
        afterSignOutUrl="/sign-in"
      >
        <App />
      </ClerkProvider>
    ) : (
      <ClerkSetupNotice />
    )}
  </React.StrictMode>
);
