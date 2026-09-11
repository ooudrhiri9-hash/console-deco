'use client';

import Link from '@/components/Link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { api, ApiError, clearToken, getToken, onExpired, setToken } from './client';
import { API_URL } from '@/config/api';

type Admin = { email: string; name: string };
type Phase = 'checking' | 'out' | 'in';

const NAV = [
  { href: '/admin/', label: 'Tableau de bord' },
  { href: '/admin/produits/', label: 'Pièces' },
  { href: '/admin/commandes/', label: 'Commandes' },
  { href: '/admin/messages/', label: 'Messages' },
  { href: '/admin/reglages/', label: 'Réglages' },
];

/**
 * Everything every back-office page shares: the token check, the login form,
 * the navigation and the sign-out button. A page below it can assume it is
 * only ever rendered for a signed-in administrator.
 */
export default function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>('checking');
  const [admin, setAdmin] = useState<Admin | null>(null);

  const check = useCallback(async () => {
    if (!getToken()) {
      setPhase('out');
      return;
    }
    try {
      const { admin: me } = await api<{ admin: Admin }>('/api/admin/me');
      setAdmin(me);
      setPhase('in');
    } catch {
      // Includes "API unreachable": without a verified token there is nothing
      // useful to show, so the login form is the honest screen either way.
      setPhase('out');
    }
  }, []);

  useEffect(() => {
    check();
    return onExpired(() => {
      setAdmin(null);
      setPhase('out');
    });
  }, [check]);

  function signOut() {
    clearToken();
    setAdmin(null);
    setPhase('out');
  }

  if (phase === 'checking') {
    return <div className="adm-boot">Vérification de la session…</div>;
  }

  if (phase === 'out') {
    return <LoginScreen onDone={check} />;
  }

  return (
    <div className="adm">
      <header className="adm-top">
        <div className="adm-top__brand">
          <strong>Atelier Omar</strong>
          <span className="adm-top__tag">Back office</span>
        </div>
        <nav className="adm-nav">
          {NAV.map((item) => {
            const active = item.href === '/admin/'
              ? pathname === '/admin' || pathname === '/admin/'
              : pathname.startsWith(item.href.replace(/\/$/, ''));
            return (
              <Link key={item.href} href={item.href} className={active ? 'is-active' : ''}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="adm-top__right">
          <span className="adm-who">{admin?.email}</span>
          <button type="button" className="adm-btn adm-btn--ghost" onClick={signOut}>
            Se déconnecter
          </button>
        </div>
      </header>

      <main className="adm-main">
        <h1 className="adm-h1">{title}</h1>
        {children}
      </main>
    </div>
  );
}

function LoginScreen({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { token } = await api<{ token: string }>('/api/admin/login', {
        method: 'POST',
        body: { email, password },
        anonymous: true,
      });
      setToken(token);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion impossible.');
      setBusy(false);
    }
  }

  return (
    <div className="adm-login">
      <form className="adm-card adm-login__box" onSubmit={submit}>
        <h1 className="adm-login__title">Atelier Omar</h1>
        <p className="adm-muted">Espace d’administration</p>

        {error && <p className="adm-alert adm-alert--err">{error}</p>}

        <label className="adm-field">
          <span>E-mail</span>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="adm-field">
          <span>Mot de passe</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>

        <p className="adm-login__api">API : {API_URL}</p>
      </form>
    </div>
  );
}
