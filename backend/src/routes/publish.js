import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { requireAdmin } from '../auth.js';
import { ROOT } from '../env.js';

/**
 * Le bouton « Publier le site » de /admin.
 *
 * Le site est du HTML statique : une pièce créée dans /admin n'a pas de page
 * tant qu'il n'est pas reconstruit. Cette route lance deploy/publish.sh — build
 * depuis la base, puis copie dans /var/www — et en suit l'état, que le
 * back-office interroge toutes les quelques secondes.
 *
 * L'état vit en mémoire : un redémarrage de l'API pendant un build l'oublie,
 * mais le verrou du script empêche quand même d'en lancer un second.
 */
export const publishRoutes = Router();

const SCRIPT = path.resolve(ROOT, '..', 'deploy', 'publish.sh');
const LOG = path.join(ROOT, '.data', 'publish.log');
/** Au-delà, le build est considéré comme bloqué et arrêté. */
const TIMEOUT_MS = 15 * 60_000;

/** Le build tourne sur le VPS (Linux), pas sur un poste de développement. */
const available = () => process.platform === 'linux' && fs.existsSync(SCRIPT);

let state = { status: 'idle', startedAt: null, finishedAt: null, error: '' };

/** Les dernières lignes du journal : ce qui explique un échec. */
function tail(lines = 12) {
  try {
    return fs.readFileSync(LOG, 'utf8').trim().split('\n').slice(-lines).join('\n');
  } catch {
    return '';
  }
}

publishRoutes.get('/publish', requireAdmin, (req, res) => {
  res.json({ ...state, available: available() });
});

publishRoutes.post('/publish', requireAdmin, (req, res) => {
  if (!available()) {
    res.status(501).json({ error: 'La publication ne se lance que depuis le serveur en ligne.' });
    return;
  }
  if (state.status === 'running') {
    res.status(409).json({ ...state, error: 'Une publication est déjà en cours.' });
    return;
  }

  fs.mkdirSync(path.dirname(LOG), { recursive: true });
  const out = fs.openSync(LOG, 'w');
  const child = spawn('bash', [SCRIPT], { cwd: path.dirname(SCRIPT), stdio: ['ignore', out, out] });
  fs.closeSync(out);

  state = { status: 'running', startedAt: new Date().toISOString(), finishedAt: null, error: '' };
  const timer = setTimeout(() => child.kill('SIGTERM'), TIMEOUT_MS);

  const finish = (ok, error = '') => {
    clearTimeout(timer);
    state = { ...state, status: ok ? 'ok' : 'failed', finishedAt: new Date().toISOString(), error };
  };
  child.on('error', (e) => finish(false, e.message));
  child.on('exit', (code, signal) => {
    if (code === 0) finish(true);
    else if (code === 75) finish(false, 'Une publication ou un déploiement était déjà en cours. Réessayez dans quelques minutes.');
    else finish(false, signal ? `Publication arrêtée (${signal}).\n${tail()}` : tail() || `Échec (code ${code}).`);
  });

  res.status(202).json({ ...state, available: true });
});
