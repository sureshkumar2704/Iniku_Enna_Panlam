import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSignIn, useSignUp } from '@clerk/clerk-react';
import AppBrand from '../components/AppBrand';
import { deriveAccountCredentials } from '../utils/accountCredentials';
import { disableGuestMode, enableGuestMode } from '../utils/guestMode';
import { clearLocalAuthSession, setLocalAuthSession } from '../utils/localAuth';

const clerkErrorMessages = {
  form_identifier_not_found: 'No account was found with that email or username.',
  form_password_incorrect: 'The password you entered is incorrect.',
  form_identifier_exists: 'An account already exists with that email or username.',
  form_username_invalid_character: 'Usernames can only use letters, numbers, underscores, and hyphens.',
  form_username_length_too_short: 'Username is too short.',
  form_username_length_too_long: 'Username is too long.',
  form_password_length_too_short: 'Password is too short.',
  form_password_pwned: 'This password has appeared in a data breach. Choose a stronger password.',
  form_param_format_invalid: 'Please check the highlighted field and try again.',
  form_param_nil: 'Please fill in all required fields.',
  verification_expired: 'That verification expired. Please try again.',
  oauth_provider_not_enabled: 'This sign-in option is not enabled yet.',
};

async function attemptSupabaseProfileLogin(identifier, password) {
  const response = await fetch('/api/profile-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || 'Supabase profile login failed.');
  return data.profile;
}

function getAuthErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const firstError = err?.errors?.[0];
  const code = firstError?.code || err?.code;
  const clerkMessage = firstError?.longMessage || firstError?.message || err?.longMessage || err?.message;

  if (/verification strategy is not valid/i.test(String(clerkMessage || ''))) {
    return 'Password login is not enabled for this account. Enable username/password sign-in in Clerk, or set a generated password from your profile first.';
  }

  if (code && clerkErrorMessages[code]) {
    return clerkErrorMessages[code];
  }

  if (typeof clerkMessage === 'string' && clerkMessage.trim()) {
    return clerkMessage.replace(/^Error:\s*/i, '');
  }

  return fallback;
}

function getIncompleteAuthMessage(result, fallback) {
  const formatFieldName = (field) => String(field).replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

  if (result?.status === 'needs_verification') {
    return 'Please verify your email to finish creating your account.';
  }

  if (result?.status === 'missing_requirements') {
    const unverifiedFields = Array.isArray(result?.unverifiedFields) ? result.unverifiedFields : [];
    if (unverifiedFields.length > 0) {
      return `Please verify these fields to finish creating your account: ${unverifiedFields.map(formatFieldName).join(', ')}.`;
    }

    const missingFields = Array.isArray(result?.missingFields) ? result.missingFields : [];
    if (missingFields.length > 0) {
      return `Your account still needs: ${missingFields.map(formatFieldName).join(', ')}.`;
    }

    const requiredFields = Array.isArray(result?.requiredFields) ? result.requiredFields : [];
    if (requiredFields.length > 0) {
      return `Your account needs these required details: ${requiredFields.map(formatFieldName).join(', ')}.`;
    }

    return 'Your account needs one more required detail before it can be completed.';
  }

  if (result?.status === 'needs_first_factor') {
    return 'Please complete the required sign-in step to continue.';
  }

  if (result?.status === 'needs_second_factor') {
    return 'Please complete two-step verification to continue.';
  }

  return fallback;
}

export default function AuthPage({ mode }) {
  const isSignIn = mode === 'sign-in';
  const navigate = useNavigate();
  const { signIn, isLoaded: signInLoaded, setActive: setSignInActive } = useSignIn();
  const { signUp, isLoaded: signUpLoaded, setActive: setSignUpActive } = useSignUp();
  const [identifier, setIdentifier] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [authStep, setAuthStep] = React.useState('email');
  const [verificationCode, setVerificationCode] = React.useState('');
  const [emailVerificationState, setEmailVerificationState] = React.useState('idle');
  const generatedCredentials = React.useMemo(() => deriveAccountCredentials(email), [email]);

  const continueAsGuest = () => {
    clearLocalAuthSession();
    enableGuestMode();
    setError('');
    navigate('/');
  };

  const handleOAuth = async (strategy) => {
    try {
      if (!signUpLoaded) return;

      disableGuestMode();
      clearLocalAuthSession();

      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      });
    } catch (err) {
      console.error('OAuth redirect failed', err);
      setError(getAuthErrorMessage(err, 'Could not start this sign-in option. Please try another method.'));
    }
  };

  const resetVerificationState = () => {
    setAuthStep('email');
    setVerificationCode('');
    setEmailVerificationState('idle');
  };

  const sendEmailVerificationCode = async () => {
    if (!signUpLoaded) {
      setError('Auth not loaded');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first name and last name first');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address first');
      return;
    }

    setLoading(true);
    try {
      await signUp.create({
        firstName,
        lastName,
        username: generatedCredentials.username,
        password: generatedCredentials.password,
        emailAddress: email,
        unsafeMetadata: {
          generatedPassword: generatedCredentials.password,
          generatedFromEmail: email,
        },
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setAuthStep('verify-email');
      setEmailVerificationState('sent');
      setVerificationCode('');
      setError('');
    } catch (err) {
      console.error('Email verification code request failed', err);
      setEmailVerificationState('failed');
      setError(getAuthErrorMessage(err, 'Unable to send the verification code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailCode = async () => {
    if (!signUpLoaded) {
      setError('Auth not loaded');
      return;
    }

    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: verificationCode });
      setEmailVerificationState('verified');

      if (result.status === 'complete' && result.createdSessionId) {
        await setSignUpActive({ session: result.createdSessionId });
        navigate('/');
        return;
      }

      setAuthStep('password');
      setError('');
    } catch (err) {
      console.error('Email verification error', err);
      setEmailVerificationState('failed');
      setError(getAuthErrorMessage(err, 'Unable to verify your email. Please check the code and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const finalizeSignUp = async () => {
    if (!signUpLoaded) {
      setError('Auth not loaded');
      return;
    }

    if (emailVerificationState !== 'verified') {
      setError('Please verify your email before creating the account');
      return;
    }

    setLoading(true);
    try {
      const { username, password } = generatedCredentials;
      const result = await signUp.update({
        username,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        unsafeMetadata: {
          generatedPassword: password,
          generatedFromEmail: email,
        },
      });

      if (result.status === 'complete' && result.createdSessionId) {
        await setSignUpActive({ session: result.createdSessionId });
        navigate('/');
        return;
      }

      setError(getIncompleteAuthMessage(result, 'Account created, but it still needs one more step before you can enter the app.'));
    } catch (err) {
      console.error('Manual signup error', err);
      setError(getAuthErrorMessage(err, 'Unable to create your account. Please check your details.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-copy">
          <div className="auth-copy__content">
            <AppBrand />
            <div className="auth-swoosh" aria-hidden="true" />
            <div className="auth-benefits" aria-label="App benefits">
              <div className="auth-benefit">
                <span className="auth-benefit__icon auth-benefit__icon--green">
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <div>
                  <strong>Plan your day</strong>
                  <span>Organize tasks effortlessly</span>
                </div>
              </div>
              <div className="auth-benefit">
                <span className="auth-benefit__icon auth-benefit__icon--gold">
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <circle cx="12" cy="12" r="7" />
                    <circle cx="12" cy="12" r="2" />
                    <path d="M12 5v2M12 17v2M5 12h2M17 12h2" />
                  </svg>
                </span>
                <div>
                  <strong>Stay focused</strong>
                  <span>Track progress and build habits</span>
                </div>
              </div>
              <div className="auth-benefit">
                <span className="auth-benefit__icon auth-benefit__icon--violet">
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <path d="M6 20v-5M12 20V9M18 20V4" />
                  </svg>
                </span>
                <div>
                  <strong>Achieve more</strong>
                  <span>Small steps, big results</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-panel-inner">
            <div className="auth-panel-head">
              <h2 className="auth-panel-title">
                {isSignIn ? 'Welcome back' : <>Create <span>your</span> account</>}
              </h2>
              <p>{isSignIn ? 'Sign in to continue' : 'Verify your email before completing signup'}</p>
            </div>

            <div className="auth-panel-actions">
              <div className="auth-oauth-row">
                <button type="button" className="auth-btn auth-btn--google" onClick={() => handleOAuth('oauth_google')}>
                  <span className="auth-btn__icon">
                    <svg viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path fill="#4285f4" d="M533.5 278.4c0-17.4-1.6-34.1-4.7-50.4H272v95.4h147.4c-6.4 34.5-25.8 63.7-55 83.3v68h88.8c52-48 82.3-118.4 82.3-196.3z" />
                      <path fill="#34a853" d="M272 544.3c74 0 136-24.4 181.3-66.3l-88.8-68c-24.7 16.6-56.3 26.5-92.5 26.5-71 0-131-48-152.3-112.6H31.5v70.6C76.8 488.1 168.9 544.3 272 544.3z" />
                      <path fill="#fbbc04" d="M119.7 321.9c-10.6-31.6-10.6-65.8 0-97.4V154h-88.2C7.6 204.4 0 238.7 0 272.2s7.6 67.8 31.5 118.1l88.2-68.4z" />
                      <path fill="#ea4335" d="M272 109.7c39.9 0 75.8 13.7 104.1 40.5l78-78C404.3 23.3 343 0 272 0 168.9 0 76.8 56.2 31.5 154l88.2 70.6C141 158 201 109.7 272 109.7z" />
                    </svg>
                  </span>
                  <span>Google</span>
                </button>

                <button type="button" className="auth-btn auth-btn--apple" onClick={() => handleOAuth('oauth_apple')}>
                  <span className="auth-btn__icon">
                    <svg viewBox="0 0 24 24" aria-hidden>
                      <path d="M16.8 12.6c0-2.5 2.1-3.7 2.2-3.8-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9s-2-.9-3.3-.9c-1.7 0-3.3 1-4.1 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.5 1.3-.1 1.8-.8 3.3-.8s1.9.8 3.3.8 2.2-1.2 3.1-2.4c1-1.4 1.4-2.8 1.4-2.9 0 0-2.9-1.1-3-4.1ZM14.4 5.2c.7-.9 1.2-2 1.1-3.2-1.1 0-2.3.7-3.1 1.6-.7.8-1.3 2-1.1 3.1 1.2.1 2.4-.6 3.1-1.5Z" />
                    </svg>
                  </span>
                  <span>Apple</span>
                </button>
              </div>

              <div className="auth-or">or</div>

              <button type="button" className="auth-guest-btn" onClick={continueAsGuest}>
                Continue as guest
              </button>

              {isSignIn ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setError('');
                    setLoading(true);
                    try {
                      disableGuestMode();
                      clearLocalAuthSession();
                      if (!signInLoaded) throw new Error('Auth not loaded');
                      try {
                        const profile = await attemptSupabaseProfileLogin(identifier.trim(), password);
                        setLocalAuthSession(profile);
                        navigate('/');
                        return;
                      } catch (profileLoginError) {
                        console.warn('Supabase profile login failed, trying Clerk', profileLoginError);
                      }

                      const result = await signIn.create({ identifier: identifier.trim(), password });

                      if (result.status === 'complete' && result.createdSessionId) {
                        await setSignInActive({ session: result.createdSessionId });
                        navigate('/');
                        return;
                      }

                      setError(getIncompleteAuthMessage(result, 'Sign in could not be completed. Please try again.'));
                    } catch (err) {
                      console.error('Auth error', err);
                      setError(getAuthErrorMessage(err, 'Unable to sign in. Please check your details.'));
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="auth-email-form"
                >
                  <label className="auth-field">
                    <span className="auth-field__icon">
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                        <path d="M4 21a8 8 0 0 1 16 0" />
                      </svg>
                    </span>
                    <input
                      className="task-input"
                      placeholder="Email or username"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      type="text"
                      autoComplete="username"
                      required
                    />
                  </label>

                  <label className="auth-field">
                    <span className="auth-field__icon">
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <rect x="5" y="10" width="14" height="10" rx="2" />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      </svg>
                    </span>
                    <input className="task-input" placeholder="Generated password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required />
                  </label>

                  {error && <div className="auth-error">{error}</div>}

                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    <span>{loading ? 'Working...' : 'Sign in'}</span>
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setError('');
                    clearLocalAuthSession();
                    disableGuestMode();

                    if (authStep === 'email') {
                      await sendEmailVerificationCode();
                      return;
                    }

                    if (authStep === 'verify-email') {
                      await verifyEmailCode();
                      return;
                    }

                    await finalizeSignUp();
                  }}
                  className="auth-email-form"
                >
                  <div className="auth-form-row">
                    <label className="auth-field">
                      <span className="auth-field__icon">
                        <svg viewBox="0 0 24 24" aria-hidden>
                          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                          <path d="M4 21a8 8 0 0 1 16 0" />
                        </svg>
                      </span>
                      <input className="task-input" placeholder="First name" value={firstName} onChange={(e) => {
                        setFirstName(e.target.value);
                        if (authStep !== 'email') resetVerificationState();
                      }} type="text" required />
                    </label>
                    <label className="auth-field">
                      <span className="auth-field__icon">
                        <svg viewBox="0 0 24 24" aria-hidden>
                          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                          <path d="M4 21a8 8 0 0 1 16 0" />
                        </svg>
                      </span>
                      <input className="task-input" placeholder="Last name" value={lastName} onChange={(e) => {
                        setLastName(e.target.value);
                        if (authStep !== 'email') resetVerificationState();
                      }} type="text" required />
                    </label>
                  </div>

                  <label className="auth-field auth-field--email">
                    <span className="auth-field__icon">
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <path d="M4 6h16v12H4z" />
                        <path d="m4 7 8 6 8-6" />
                      </svg>
                    </span>
                    <div className="auth-field__email-row">
                      <input
                        className="task-input"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (authStep !== 'email') resetVerificationState();
                        }}
                        type="email"
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-secondary auth-field__inline-btn"
                        onClick={sendEmailVerificationCode}
                        disabled={loading || !email.trim()}
                      >
                        {authStep === 'verify-email' ? 'Resend code' : 'Send code'}
                      </button>
                      <span
                        className={`auth-field__status auth-field__status--${emailVerificationState}`}
                        aria-label={
                          emailVerificationState === 'verified'
                            ? 'Email verified'
                            : emailVerificationState === 'failed'
                              ? 'Email verification failed'
                              : emailVerificationState === 'sent'
                                ? 'Verification code sent'
                                : 'Email not verified yet'
                        }
                      >
                        {emailVerificationState === 'verified' ? '✓ Verification successful' : emailVerificationState === 'failed' ? '✕ Not verified' : emailVerificationState === 'sent' ? 'Code sent.' : ''}
                      </span>
                    </div>
                  </label>

                  {authStep === 'verify-email' && (
                    <>
                      <label className="auth-field auth-field--code">
                        <span className="auth-field__icon">
                          <svg viewBox="0 0 24 24" aria-hidden>
                            <rect x="5" y="10" width="14" height="10" rx="2" />
                            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                          </svg>
                        </span>
                        <input
                          className="task-input"
                          placeholder="Verification code"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          required
                        />
                      </label>
                      <div className="auth-verification-state">
                        {emailVerificationState === 'verified' && '✓ Verification successful'}
                        {emailVerificationState === 'failed' && '✕ Not verified'}
                        {emailVerificationState === 'sent' && 'Code sent.'}
                      </div>
                    </>
                  )}

                  {authStep === 'password' && (
                    <div className="auth-generated-card">
                      <div className="auth-generated-card__head">
                        <strong>Your generated account details</strong>
                        <span>Derived from {email || 'your email'}</span>
                      </div>

                      <div className="auth-generated-grid">
                        <div className="auth-generated-field">
                          <span>Username</span>
                          <strong>{generatedCredentials.username}</strong>
                        </div>
                        <div className="auth-generated-field">
                          <span>Password</span>
                          <strong>Hidden</strong>
                        </div>
                      </div>

                      <p className="auth-generated-note">
                        These details are created automatically from your email address. The password is stored in the database and hidden on screen.
                      </p>
                    </div>
                  )}

                  {!isSignIn && <div id="clerk-captcha" className="clerk-captcha-slot" />}

                  {error && <div className="auth-error">{error}</div>}

                  {authStep === 'email' && (
                    <button type="submit" className="btn btn-primary" disabled={loading || !email.trim()}>
                      <span>{loading ? 'Sending...' : 'Send verification code'}</span>
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <path d="M5 12h14" />
                        <path d="m13 6 6 6-6 6" />
                      </svg>
                    </button>
                  )}

                  {authStep === 'verify-email' && (
                    <button type="submit" className="btn btn-primary" disabled={loading || !verificationCode.trim()}>
                      <span>{loading ? 'Verifying...' : 'Verify email'}</span>
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <path d="M5 12h14" />
                        <path d="m13 6 6 6-6 6" />
                      </svg>
                    </button>
                  )}

                  {authStep === 'password' && (
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      <span>{loading ? 'Creating...' : 'Create account'}</span>
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <path d="M5 12h14" />
                        <path d="m13 6 6 6-6 6" />
                      </svg>
                    </button>
                  )}
                </form>
              )}

              <p className="auth-switch-text">
                {isSignIn ? 'New here?' : 'Already have an account?'}{' '}
                <Link to={isSignIn ? '/sign-up' : '/sign-in'}>{isSignIn ? 'Create an account' : 'Log in'}</Link>
              </p>
            </div>
          </div>
        </section>

        
      </div>
    </div>
  );
}
