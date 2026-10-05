'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from './client';

type PublishState = {
  status: 'idle' | 'running' | 'ok' | 'failed';
  startedAt: string | null;
  finishedAt: string | null;
  error: string;
  available: boolean;
};

const time = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

/**
 * « Publier le site » : reconstruit les pages à partir de la base.
 *
 * Nécessaire après l'ajout d'une pièce — elle n'a pas de page avant — ou d'un
 * changement de référencement. Les prix, stocks et textes se mettent à jour
 * sans. Le build prend une à trois minutes ; l'état est relu toutes les 4 s
 * tant qu'il tourne, et reste affiché si l'on change de page entre-temps.
 */
export default function PublishButton() {
  const [state, setState] = useState<PublishState | null>(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setState(await api<PublishState>('/api/admin/publish'));
    } catch {
      /* l'API ancienne n'a pas la route : le bouton reste caché */
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const running = state?.status === 'running';
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(refresh, 4000);
    return () => window.clearInterval(id);
  }, [running, refresh]);

  async function publish() {
    if (!window.confirm('Reconstruire et publier le site ? Cela prend une à trois minutes.')) return;
    setError('');
    try {
      setState(await api<PublishState>('/api/admin/publish', { method: 'POST' }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Publication impossible.');
      refresh();
    }
  }

  if (!state?.available) return null;

  const failed = state.status === 'failed' || !!error;
  const label = running
    ? 'Publication en cours…'
    : failed
      ? 'Échec de la publication'
      : state.status === 'ok'
        ? `Site publié à ${time(state.finishedAt)}`
        : '';

  return (
    <div className="adm-publish">
      {label && (
        <span
          className={`adm-publish__state${failed ? ' is-err' : ''}`}
          title={failed ? error || state.error : undefined}
          role="status"
        >
          {label}
          {failed && (
            <button type="button" className="adm-publish__more" onClick={() => window.alert(error || state.error)}>
              détails
            </button>
          )}
        </span>
      )}
      <button type="button" className="adm-btn adm-publish__btn" onClick={publish} disabled={running}>
        {running ? 'Publication…' : 'Publier le site'}
      </button>
    </div>
  );
}
