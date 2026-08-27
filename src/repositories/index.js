'use strict';

const config = require('../config');
const memberContract = require('./contracts/member.contract');
const playgroundContract = require('./contracts/playground.contract');
const discoveryContract = require('./contracts/discovery.contract');

/**
 * Repository binding point.
 *
 * The host LiF application calls `bind()` at boot with its own repositories.
 * Until it does, and only outside production, the isolated dev adapter under
 * /dev is used so the presentation layer can be reviewed with realistic data.
 *
 * `/dev` sits outside `src/` deliberately: a production bundle that ships only
 * `src/` cannot reach the fixtures at all (AI Run Instructions v2.1 §7).
 */

let bound = null;

function assertImplements(name, impl, contract) {
  const missing = contract.REQUIRED_METHODS.filter((m) => typeof impl[m] !== 'function');
  if (missing.length) {
    throw new Error(`${name} is missing contract methods: ${missing.join(', ')}`);
  }
}

function bind(repositories) {
  assertImplements('memberRepository', repositories.memberRepository, memberContract);
  assertImplements('playgroundRepository', repositories.playgroundRepository, playgroundContract);
  assertImplements('discoveryRepository', repositories.discoveryRepository, discoveryContract);
  bound = repositories;
  return bound;
}

function get() {
  if (bound) return bound;

  if (config.dataAdapter !== 'dev') {
    throw new Error(
      'No repository adapters are bound. The host LiF application must call ' +
      'repositories.bind({ memberRepository, playgroundRepository }) at boot.'
    );
  }

  // eslint-disable-next-line global-require
  const devAdapter = require('../../dev/adapters/devRepositories');
  return bind(devAdapter.create());
}

function reset() {
  bound = null;
}

module.exports = { bind, get, reset };
