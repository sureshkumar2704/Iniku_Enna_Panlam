import React from 'react';
import { Link } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/clerk-react';
import AppBrand from '../components/AppBrand';

const clerkAppearance = {
  variables: {
    colorPrimary: '#a78bfa',
    colorBackground: '#0f0f16',
    colorInputBackground: 'rgba(255, 255, 255, 0.05)',
    colorInputText: '#ffffff',
    colorText: '#ffffff',
    colorTextSecondary: '#c9c8e8',
    colorNeutral: '#8f8dae',
  },
  elements: {
    card: 'auth-clerk-card',
    headerTitle: 'auth-clerk-title',
    headerSubtitle: 'auth-clerk-subtitle',
    socialButtonsBlockButton: 'auth-clerk-social-button',
    formButtonPrimary: 'auth-clerk-primary-button',
    formFieldInput: 'auth-clerk-input',
    footerActionLink: 'auth-clerk-link',
    identityPreviewText: 'auth-clerk-muted',
    identityPreviewEditButton: 'auth-clerk-edit',
  },
};

export default function AuthPage({ mode }) {
  const isSignIn = mode === 'sign-in';

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-copy">
          <AppBrand />
          <div className="auth-badge">Private workspace</div>
          <p className="auth-minimal-copy">
            Sign in with Google or email to continue.
          </p>
          <p className="auth-switch-text">
            {isSignIn ? 'New here?' : 'Already have an account?'}{' '}
            <Link to={isSignIn ? '/sign-up' : '/sign-in'}>
              {isSignIn ? 'Create an account' : 'Log in'}
            </Link>
          </p>
        </section>

        <section className="auth-panel">
          <div className="auth-panel-inner">
            {isSignIn ? (
              <SignIn
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-up"
                fallbackRedirectUrl="/"
                appearance={clerkAppearance}
              />
            ) : (
              <SignUp
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                fallbackRedirectUrl="/"
                appearance={clerkAppearance}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}