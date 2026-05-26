import React from 'react';
import { Link } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import useSupabaseToken from '../hooks/useSupabaseToken';
import useCurrentUser from '../hooks/useCurrentUser';
import { deriveAccountCredentials, deriveCredentialsFromUsername } from '../utils/accountCredentials';
import { fetchUserProfile, saveUserProfile, upsertUserProfile } from '../utils/profileStore';
import { isGuestModeEnabled } from '../utils/guestMode';
import { clearLocalAuthSession, setLocalAuthSession } from '../utils/localAuth';

function copyText(value) {
  if (!value || !navigator?.clipboard?.writeText) return Promise.resolve();
  return navigator.clipboard.writeText(value);
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const currentUser = useCurrentUser();
  const { signOut } = useClerk();
  const { token, isReady, isSignedIn } = useSupabaseToken();
  const [profile, setProfile] = React.useState(null);
  const [form, setForm] = React.useState({ username: '', first_name: '', last_name: '', image_url: '', generated_password: '' });
  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  const activeUserId = currentUser.userId;
  const localProfile = currentUser.profile;
  const email = localProfile?.email || user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
  const credentials = React.useMemo(() => deriveAccountCredentials(email), [email]);
  const avatarUrl = profile?.image_url || user?.imageUrl || user?.profileImageUrl || '';
  const profileInitial = (profile?.first_name || user?.firstName || profile?.username || user?.username || 'U').slice(0, 1).toUpperCase();
  const guestMode = isGuestModeEnabled();

  React.useEffect(() => {
    let active = true;

    if (guestMode) {
      setLoading(false);
      setIsEditing(false);
      setProfile(null);
      return () => {
        active = false;
      };
    }

    async function loadProfile() {
      if (!isLoaded && currentUser.authType === 'clerk') return;
      if (!isReady || !isSignedIn || !activeUserId) return;

      setLoading(true);
      setError('');
      try {
        const existingProfile = await fetchUserProfile(activeUserId, token);
        const nextProfile = existingProfile || (user ? await upsertUserProfile(user, token, credentials) : localProfile);

        if (!active) return;

        setProfile(nextProfile);
        setForm({
          username: nextProfile?.username || credentials.username,
          first_name: nextProfile?.first_name || user?.firstName || '',
          last_name: nextProfile?.last_name || user?.lastName || '',
          image_url: nextProfile?.image_url || user?.imageUrl || '',
          generated_password: nextProfile?.generated_password || credentials.password,
        });
          setIsEditing(false);
      } catch (err) {
        console.error('Profile load failed', err);
        if (active) setError('Unable to load your saved profile details right now.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [activeUserId, credentials, currentUser.authType, guestMode, isLoaded, isReady, isSignedIn, localProfile, token, user]);

  const derivedUsername = profile?.username || credentials.username;
  const generatedLoginPassword = profile?.generated_password || deriveCredentialsFromUsername(derivedUsername).password;
  const editedUsername = form.username || derivedUsername;
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim()
    || profile?.full_name
    || localProfile?.full_name
    || user?.fullName
    || user?.firstName
    || 'Your profile';

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => {
      if (field !== 'username') return { ...current, [field]: value };

      const generated = deriveCredentialsFromUsername(value || derivedUsername);
      return {
        ...current,
        username: value,
        generated_password: generated.password,
      };
    });
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (!activeUserId) return;

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const generatedCredentials = deriveCredentialsFromUsername(form.username.trim() || derivedUsername);
      const nextUsername = generatedCredentials.username;
      const nextPassword = form.generated_password.trim() || generatedCredentials.password;
      const nextFirstName = form.first_name.trim();
      const nextLastName = form.last_name.trim();

      const nextProfile = {
        id: activeUserId,
        user_id: activeUserId,
        email,
        username: nextUsername,
        first_name: nextFirstName,
        last_name: nextLastName,
        full_name: [nextFirstName, nextLastName].filter(Boolean).join(' ').trim(),
        image_url: form.image_url.trim(),
        provider: profile?.provider || user?.externalAccounts?.[0]?.provider || localProfile?.provider || 'supabase-profile',
        generated_password: nextPassword,
        generated_from_email: email,
      };

      const savedProfile = await saveUserProfile(nextProfile, token);
      if (!savedProfile) throw new Error('Profile save failed');

      setProfile(savedProfile);
      if (currentUser.authType === 'supabase-profile') setLocalAuthSession(savedProfile);
      setForm({
        username: savedProfile.username,
        first_name: savedProfile.first_name,
        last_name: savedProfile.last_name,
        image_url: savedProfile.image_url,
        generated_password: savedProfile.generated_password,
      });
      setMessage('Profile saved to Supabase.');
      setIsEditing(false);
    } catch (err) {
      console.error('Profile save failed', err);
      const profileMessage = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || '';
      setError(profileMessage ? `Could not save profile: ${profileMessage}` : 'Could not save your profile changes.');
    } finally {
      setSaving(false);
    }
  };

  if (guestMode || (!user && currentUser.authType !== 'supabase-profile')) {
    return (
      <main className="profile-page">
        <div className="profile-shell">
          <section className="profile-hero">
            <div className="profile-hero__actions">
              <Link to="/" className="profile-back-btn" aria-label="Back to home">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="m14 6-6 6 6 6" />
                  <path d="M20 12H8" />
                </svg>
                <span>Home</span>
              </Link>
            </div>
            <div className="profile-hero__identity">
              <div className="profile-hero__avatar">
                <span>G</span>
              </div>
              <div>
                <span className="profile-eyebrow">Guest mode</span>
                <h1>Browse without an account</h1>
              </div>
            </div>
            <p>
              You can use the app without signing in. Changes stay local in this session and are not saved to Supabase.
            </p>
          </section>

          <section className="profile-card profile-card--wide">
            <div className="profile-card__label">Default access</div>
            <div className="profile-card__hint">Profile storage is disabled until you sign in.</div>
          </section>
        </div>
      </main>
    );
  }

  if (!isLoaded && currentUser.authType === 'clerk') {
    return (
      <main className="profile-page profile-page--loading">
        <div className="profile-shell">
          <div className="profile-card">Loading profile…</div>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <div className="profile-shell">
        <section className="profile-hero">
          <div className="profile-hero__actions">
            <Link to="/" className="profile-back-btn" aria-label="Back to home">
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="m14 6-6 6 6 6" />
                <path d="M20 12H8" />
              </svg>
              <span>Home</span>
            </Link>
            <button
              type="button"
              className="profile-edit-btn"
              aria-label={isEditing ? 'Editing profile' : 'Edit profile'}
              aria-pressed={isEditing}
              onClick={() => {
                setIsEditing(true);
                setMessage('');
                setError('');
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M4 20h4l10-10a2.5 2.5 0 0 0-4-4L4 16v4Z" />
                <path d="m14 6 4 4" />
              </svg>
              <span>{isEditing ? 'Editing' : 'Edit'}</span>
            </button>
          </div>
          <div className="profile-hero__identity">
            <div className="profile-hero__avatar">
              {avatarUrl ? <img src={avatarUrl} alt="Profile" /> : <span>{profileInitial}</span>}
            </div>
            <div>
              <span className="profile-eyebrow">Account</span>
              <h1>{displayName}</h1>
            </div>
          </div>
          <p>
            This profile is managed by the app and reads the saved row from Supabase.
          </p>
        </section>

        {isEditing && (
          <form className="profile-card profile-card--wide profile-form" onSubmit={handleSaveProfile}>
            <div className="profile-card__label">Edit profile</div>
            <div className="profile-form__grid">
              <label className="profile-form__field profile-form__field--wide">
                <span>Username</span>
                <input className="task-input" type="text" value={form.username} onChange={handleChange('username')} autoComplete="username" />
              </label>
              <label className="profile-form__field profile-form__field--wide">
                <span>Password</span>
                <div className="profile-password-row">
                  <input
                    className="task-input profile-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={form.generated_password}
                    onChange={handleChange('generated_password')}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="profile-password-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <path d="M3 3l18 18" />
                        <path d="M10.58 10.58A2 2 0 0 0 13.42 13.42" />
                        <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a17.7 17.7 0 0 1-3.06 4.45" />
                        <path d="M6.1 6.1C3.79 7.65 2 12 2 12s3 7 10 7a10.61 10.61 0 0 0 4.2-.87" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </label>
              <label className="profile-form__field">
                <span>First name</span>
                <input className="task-input" type="text" value={form.first_name} onChange={handleChange('first_name')} />
              </label>
              <label className="profile-form__field">
                <span>Last name</span>
                <input className="task-input" type="text" value={form.last_name} onChange={handleChange('last_name')} />
              </label>
              <label className="profile-form__field profile-form__field--wide">
                <span>Avatar URL</span>
                <input className="task-input" type="url" value={form.image_url} onChange={handleChange('image_url')} placeholder="https://..." />
              </label>
            </div>
            {error && <div className="auth-error">{error}</div>}
            {message && <div className="profile-form__message">{message}</div>}
            <div className="profile-form__actions">
              <button
                type="button"
                className="profile-cancel-btn"
                onClick={() => {
                  setIsEditing(false);
                  setMessage('');
                  setError('');
                  setForm({
                    username: profile?.username || credentials.username,
                    first_name: profile?.first_name || user?.firstName || '',
                    last_name: profile?.last_name || user?.lastName || '',
                    image_url: profile?.image_url || user?.imageUrl || '',
                    generated_password: profile?.generated_password || credentials.password,
                  });
                }}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="profile-save-btn" disabled={saving || loading}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
                <span>{saving ? 'Saving...' : 'Save changes'}</span>
              </button>
            </div>
          </form>
        )}

        <section className="profile-grid">
          <article className="profile-card">
            <div className="profile-card__label">Username</div>
            <div className="profile-card__value-row">
              <strong>{derivedUsername}</strong>
              <button type="button" className="profile-copy-btn" onClick={() => copyText(derivedUsername)}>
                Copy
              </button>
            </div>
            <div className="profile-card__hint">Generated from your email address.</div>
          </article>

          <article className="profile-card">
            <div className="profile-card__label">Generated password</div>
            <div className="profile-card__value-row">
              <strong>{showPassword ? generatedLoginPassword : 'Hidden'}</strong>
              <button type="button" className="profile-copy-btn" onClick={() => copyText(generatedLoginPassword)}>
                Copy
              </button>
            </div>
            <div className="profile-card__hint">Saved in your Supabase profile row for app use.</div>
          </article>

          <article className="profile-card profile-card--wide">
            <div className="profile-card__label">Email</div>
            <div className="profile-card__value-row">
              <strong>{email}</strong>
              <button type="button" className="profile-copy-btn" onClick={() => copyText(email)}>
                Copy
              </button>
            </div>
            <div className="profile-card__hint">Your email is the source for the generated login details.</div>
          </article>
        </section>

        <div className="profile-actions">
          <button
            type="button"
            className="profile-signout-btn"
            aria-label="Sign out"
            title="Sign out"
            onClick={() => {
              if (currentUser.authType === 'supabase-profile') {
                clearLocalAuthSession();
                window.location.assign('/sign-in');
                return;
              }
              signOut({ redirectUrl: '/sign-in' });
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M10 17v2a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v2" />
              <path d="M15 12H3" />
              <path d="m6 9-3 3 3 3" />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </main>
  );
}
