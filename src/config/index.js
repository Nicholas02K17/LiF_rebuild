'use strict';

const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';

/**
 * Review deployment.
 *
 * A hosted preview (Vercel, Render, a staging box) runs with
 * NODE_ENV=production but has no LiF backend behind it, so it has to run on the
 * fixtures in /dev. That is exactly what the guard below exists to prevent, so
 * it cannot happen quietly: it takes an environment variable whose name says
 * what it is, and the deployment then announces itself on every page.
 *
 * What this does NOT do is weaken the guard. Without this flag, production plus
 * the dev adapter still throws at boot. A real production release simply never
 * sets it.
 */
const reviewDeployment = process.env.LIF_REVIEW_DEPLOYMENT === 'true';

const config = {
  env,
  isProduction,
  reviewDeployment,
  port: Number(process.env.PORT || 3000),

  /**
   * Which data adapter backs the repository contracts.
   * The in-repo `dev` adapter is refused in production (AI Run Instructions
   * v2.1 §7 — production code must not be able to import fixture records)
   * unless this is an explicitly declared review deployment.
   */
  dataAdapter:
    process.env.LIF_DATA_ADAPTER || (isProduction && !reviewDeployment ? 'host' : 'dev'),

  locale: 'en',

  /** Motion budget. Individual durations live in CSS custom properties. */
  motion: {
    // The signature Seed of Life entrance runs once per session, not per page.
    overtureSessionKey: 'lif.overture.seen'
  }
};

if (config.isProduction && config.dataAdapter === 'dev' && !config.reviewDeployment) {
  throw new Error(
    'LIF_DATA_ADAPTER=dev is not permitted in production. The host LiF ' +
    'application must bind real repository adapters before boot. If this is a ' +
    'hosted review deployment with no backend behind it, set ' +
    'LIF_REVIEW_DEPLOYMENT=true — it will run on fixtures and say so on every page.'
  );
}

module.exports = config;
