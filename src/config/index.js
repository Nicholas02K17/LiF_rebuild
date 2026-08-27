'use strict';

const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';

const config = {
  env,
  isProduction,
  port: Number(process.env.PORT || 3000),

  /**
   * Which data adapter backs the repository contracts.
   * The in-repo `dev` adapter is refused in production (AI Run Instructions
   * v2.1 §7 — production code must not be able to import fixture records).
   */
  dataAdapter: process.env.LIF_DATA_ADAPTER || (isProduction ? 'host' : 'dev'),

  locale: 'en',

  /** Motion budget. Individual durations live in CSS custom properties. */
  motion: {
    // The signature Seed of Life entrance runs once per session, not per page.
    overtureSessionKey: 'lif.overture.seen'
  }
};

if (config.isProduction && config.dataAdapter === 'dev') {
  throw new Error(
    'LIF_DATA_ADAPTER=dev is not permitted in production. The host LiF ' +
    'application must bind real repository adapters before boot.'
  );
}

module.exports = config;
