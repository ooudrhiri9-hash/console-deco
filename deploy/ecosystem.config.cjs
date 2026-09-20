/**
 * PM2 — le process Node de l'API, redemarre au boot du VPS.
 *
 *   pm2 start deploy/ecosystem.config.cjs
 *   pm2 save && pm2 startup     # relance automatique apres un reboot
 *   pm2 logs maisondeco-api
 *
 * Les variables (MONGODB_URI, AUTH_SECRET, ALLOWED_ORIGINS...) ne sont PAS
 * ici : elles vivent dans /srv/maisondeco/backend/.env, que backend/src/env.js
 * lit au demarrage et que .gitignore garde hors du depot.
 */
module.exports = {
  apps: [
    {
      name: 'maisondeco-api',
      cwd: '/srv/maisondeco/backend',
      script: 'src/server.js',
      // Un seul vCPU sur le KVM 1 : le mode cluster n'apporterait rien et
      // doublerait la memoire utilisee.
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' },
      // sharp peut monter en memoire sur une grosse photo ; au-dela, on repart.
      max_memory_restart: '500M',
      // Une boucle de crash ne doit pas remplir le disque de logs.
      min_uptime: '20s',
      max_restarts: 10,
      restart_delay: 2000,
      merge_logs: true,
      time: true,
      error_file: '/var/log/maisondeco/api-error.log',
      out_file: '/var/log/maisondeco/api-out.log',
    },
  ],
};
