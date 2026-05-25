import React from 'react';
import { Link } from 'react-router-dom';
import { useSignIn, useSignUp } from '@clerk/clerk-react';
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
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const [showEmail, setShowEmail] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleGoogle = async () => {
    try {
      if (isSignIn) {
        if (!signInLoaded) return;
        await signIn.authenticateWithRedirect({ strategy: 'oauth_google' });
      } else {
        if (!signUpLoaded) return;
        await signUp.authenticateWithRedirect({ strategy: 'oauth_google' });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('OAuth redirect failed', err);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-copy">
          <AppBrand />
          <div className="auth-badge">Private workspace</div>
          <p className="auth-minimal-copy">Sign in with Google or email to continue.</p>
          <p className="auth-switch-text">
            {isSignIn ? 'New here?' : 'Already have an account?'}{' '}
            <Link to={isSignIn ? '/sign-up' : '/sign-in'}>
              {isSignIn ? 'Create an account' : 'Log in'}
            </Link>
          </p>
        </section>

        <section className="auth-panel">
          <div className="auth-panel-inner">
            <div className="auth-panel-head">
              <img src="/auth-brand-small.png" alt="brand" className="auth-panel-head__icon" onError={(e)=>{e.currentTarget.style.display='none'}} />
              <h2 className="auth-panel-title">{isSignIn ? 'Welcome back!' : 'Create your account'}</h2>
              <p className="auth-panel-sub">{isSignIn ? 'Sign in to continue to your productivity space.' : 'Sign up to start tracking your daily progress.'}</p>
            </div>

            <div className="auth-panel-actions">
              <button type="button" className="auth-btn auth-btn--google" onClick={handleGoogle}>
                <span className="auth-btn__icon">
                  <svg viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path fill="#4285f4" d="M533.5 278.4c0-17.4-1.6-34.1-4.7-50.4H272v95.4h147.4c-6.4 34.5-25.8 63.7-55 83.3v68h88.8c52-48 82.3-118.4 82.3-196.3z"/>
                    <path fill="#34a853" d="M272 544.3c74 0 136-24.4 181.3-66.3l-88.8-68c-24.7 16.6-56.3 26.5-92.5 26.5-71 0-131-48-152.3-112.6H31.5v70.6C76.8 488.1 168.9 544.3 272 544.3z"/>
                    <path fill="#fbbc04" d="M119.7 321.9c-10.6-31.6-10.6-65.8 0-97.4V154h-88.2C7.6 204.4 0 238.7 0 272.2s7.6 67.8 31.5 118.1l88.2-68.4z"/>
                    <path fill="#ea4335" d="M272 109.7c39.9 0 75.8 13.7 104.1 40.5l78-78C404.3 23.3 343 0 272 0 168.9 0 76.8 56.2 31.5 154l88.2 70.6C141 158 201 109.7 272 109.7z"/>
                  </svg>
                </span>
                <span>Continue with Google</span>
              </button>

              <div className="auth-or">or</div>

              <button
                type="button"
                className="auth-btn auth-btn--email"
                onClick={() => setShowEmail((s) => !s)}
              >
                <span className="auth-btn__icon">✉️</span>
                <span>{showEmail ? 'Hide email form' : isSignIn ? 'Continue with email' : 'Sign up with email'}</span>
              </button>

              {showEmail && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setError('');
                    setLoading(true);
                    try {
                      if (isSignIn) {
                        if (!signInLoaded) throw new Error('Auth not loaded');
                        // Create a sign-in attempt for this identifier (email)
                        await signIn.create({ identifier: email });
                        // Authenticate using password
                        await signIn.authenticateWithPassword({ password });
                      } else {
                        if (!signUpLoaded) throw new Error('Auth not loaded');
                        // Create a new user with email and password
                        await signUp.create({ emailAddress: email, password });
                      }
                      // On success, Clerk will redirect or create a session automatically depending on setup.
                    } catch (err) {
                      // eslint-disable-next-line no-console
                      console.error('Auth error', err);
                      setError(err?.toString() || 'Authentication failed');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="auth-email-form"
                >
                  <input
                    className="task-input"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                  />
                  <input
                    className="task-input"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    required
                  />
                  {error && <div style={{ color: 'var(--color-fail)', fontSize: '0.9rem' }}>{error}</div>}
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Working...' : isSignIn ? 'Sign in' : 'Create account'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}