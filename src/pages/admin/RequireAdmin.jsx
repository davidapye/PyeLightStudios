import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Outlet } from 'react-router-dom';
import { auth, db } from '../../firebase';
import './RequireAdmin.css';

const getSignInMessage = (error) => {
  if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
    return 'The email or password is incorrect.';
  }
  if (error.code === 'auth/too-many-requests') {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (error.code === 'auth/operation-not-allowed') {
    return 'Email and password sign-in is not enabled for this site yet.';
  }
  return 'Sign-in failed. Check your connection and try again.';
};

function AdminSignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (signInError) {
      setError(getSignInMessage(signInError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card" aria-labelledby="admin-auth-title">
        <p className="admin-auth-eyebrow">PYE LIGHT STUDIOS</p>
        <h1 id="admin-auth-title">Admin sign in</h1>
        <p className="admin-auth-intro">Sign in with your studio administrator account to manage galleries.</p>
        <form className="admin-auth-form" onSubmit={handleSubmit}>
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error && <p className="admin-auth-error" role="alert">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function RequireAdmin() {
  const [user, setUser] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => onAuthStateChanged(auth, async (nextUser) => {
    setUser(nextUser);
    setAuthorized(false);
    if (!nextUser) {
      setChecking(false);
      return;
    }

    try {
      const adminRecord = await getDoc(doc(db, 'admins', nextUser.uid));
      setAuthorized(adminRecord.exists() && adminRecord.data().admin === true);
    } catch (error) {
      console.error('Could not verify admin access:', error);
      setAuthorized(false);
    } finally {
      setChecking(false);
    }
  }), []);

  const handleSignOut = async () => {
    await signOut(auth);
    setAuthorized(false);
  };

  if (checking) {
    return <main className="admin-auth-page" role="status"><p>Checking administrator access…</p></main>;
  }
  if (!user) return <AdminSignIn />;
  if (!authorized) {
    return (
      <main className="admin-auth-page">
        <section className="admin-auth-card" aria-labelledby="admin-denied-title">
          <p className="admin-auth-eyebrow">PYE LIGHT STUDIOS</p>
          <h1 id="admin-denied-title">Admin access required</h1>
          <p className="admin-auth-intro">This account is signed in, but it isn’t authorized to manage galleries.</p>
          <button className="admin-auth-secondary" type="button" onClick={handleSignOut}>Sign out</button>
        </section>
      </main>
    );
  }

  return (
    <div className="admin-protected-area">
      <div className="admin-session-bar">
        <span>Signed in as {user.email}</span>
        <button type="button" onClick={handleSignOut}>Sign out</button>
      </div>
      <Outlet />
    </div>
  );
}
