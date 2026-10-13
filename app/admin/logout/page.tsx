'use client';
import { useEffect, useState } from 'react';
export default function LogoutPage() {
  const [error, setError] = useState(false);
  function logout() { fetch('/api/admin/logout', { method: 'POST' }).then(response => { if (!response.ok) throw new Error(); location.assign('/admin/login'); }).catch(() => setError(true)); }
  useEffect(logout, []);
  return <main className="admin-login"><p role="status">{error ? 'Unable to sign out. Please try again.' : 'Signing out…'}</p>{error && <button onClick={logout}>Try again</button>}</main>;
}
