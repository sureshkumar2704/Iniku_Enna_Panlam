import React from 'react';

export default function ClerkSetupNotice() {
  return (
    <div className="auth-page">
      <div className="auth-shell auth-shell--setup">
        <section className="auth-copy">
          <div className="auth-badge">Auth setup required</div>
          <h1>Connect Clerk to unlock login and signup</h1>
          <p>
            This app is ready for Clerk authentication. Add your Clerk publishable key,
            then enable Google and email/password in the Clerk dashboard.
          </p>
          <div className="auth-note-card">
            <p>Set this in your local environment:</p>
            <code>VITE_CLERK_PUBLISHABLE_KEY=your_publishable_key_here</code>
          </div>
          <ul className="auth-checklist">
            <li>Create a Clerk application.</li>
            <li>Copy the publishable key into your Vite env file.</li>
            <li>Enable Google OAuth and email/password sign-in in Clerk.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}