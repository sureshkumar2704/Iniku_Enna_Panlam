import React from 'react';
import { Link } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import useSupabaseToken from '../hooks/useSupabaseToken';
import { deriveAccountCredentials } from '../utils/accountCredentials';
import { fetchUserProfile, saveUserProfile, upsertUserProfile } from '../utils/profileStore';

function copyText(value) {
  if (!value || !navigator?.clipboard?.writeText) return Promise.resolve();
  return navigator.clipboard.writeText(value);
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { token, isReady, isSignedIn } = useSupabaseToken();
  const [profile, setProfile] = React.useState(null);
  const [form, setForm] = React.useState({ full_name: '', first_name: '', last_name: '', image_url: '' });
  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
  const credentials = React.useMemo(() => deriveAccountCredentials(email), [email]);
  const avatarUrl = profile?.image_url || user?.imageUrl || user?.profileImageUrl || '';
  const profileInitial = (profile?.first_name || user?.firstName || profile?.username || user?.username || 'U').slice(0, 1).toUpperCase();

  React.useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!isLoaded || !isReady || !isSignedIn || !user || !token) return;

      setLoading(true);
      setError('');
      try {
        const existingProfile = await fetchUserProfile(user.id, token);
        const nextProfile = existingProfile || await upsertUserProfile(user, token, credentials);

        if (!active) return;

        setProfile(nextProfile);
        setForm({
          full_name: nextProfile?.full_name || user.fullName || '',
          first_name: nextProfile?.first_name || user.firstName || '',
          last_name: nextProfile?.last_name || user.lastName || '',
          image_url: nextProfile?.image_url || user.imageUrl || '',
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
  }, [credentials, isLoaded, isReady, isSignedIn, token, user]);

  const derivedUsername = profile?.username || credentials.username;
  const displayedPassword = profile?.generated_password || credentials.password;

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (!user || !token) return;

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const nextProfile = {
        id: user.id,
        user_id: user.id,
        email,
        username: derivedUsername,
        full_name: form.full_name.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        image_url: form.image_url.trim(),
        provider: profile?.provider || user.externalAccounts?.[0]?.provider || '',
        generated_password: profile?.generated_password || credentials.password,
        generated_from_email: email,
      };

      const savedProfile = await saveUserProfile(nextProfile, token);
      if (!savedProfile) throw new Error('Profile save failed');

      setProfile(savedProfile);
      setMessage('Profile saved.');
      setIsEditing(false);
    } catch (err) {
      console.error('Profile save failed', err);
      setError('Could not save your profile changes.');
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded) {
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
              <h1>{profile?.full_name || user?.fullName || user?.firstName || 'Your profile'}</h1>
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
              <label className="profile-form__field">
                <span>Full name</span>
                <input className="task-input" type="text" value={form.full_name} onChange={handleChange('full_name')} />
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
            <div className="profile-form__meta">
              <div>
                <span className="profile-card__label">Username</span>
                <strong>{derivedUsername}</strong>
              </div>
              <div>
                <span className="profile-card__label">Password</span>
                <div className="profile-password-row">
                  <strong>{showPassword ? displayedPassword : 'Hidden'}</strong>
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
              </div>
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
                    full_name: profile?.full_name || user.fullName || '',
                    first_name: profile?.first_name || user.firstName || '',
                    last_name: profile?.last_name || user.lastName || '',
                    image_url: profile?.image_url || user.imageUrl || '',
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
          <button type="button" className="profile-signout-btn" aria-label="Sign out" title="Sign out" onClick={() => signOut({ redirectUrl: '/sign-in' })}>
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
