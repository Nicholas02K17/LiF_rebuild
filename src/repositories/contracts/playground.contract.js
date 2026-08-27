'use strict';

/**
 * PlaygroundRepository contract — the cross-feature reads the Hub needs.
 *
 * Every method takes a viewer context and returns only what that viewer is
 * authorized to see. Counts are derived from the same record set the detail
 * page uses, so a card count and its page can never disagree
 * (Dashboard Unified v1.2 §0.12).
 *
 * A private object's existence is never inferable from a count, a summary line
 * or an error (Shared Foundation v1.4 §5).
 *
 * @typedef {Object} ViewerContext
 * @property {string|null} memberId
 * @property {boolean}     isMember
 * @property {'for-me'|'whole-playground'} scope
 * @property {string|null} aspectFilterKey
 *
 * @typedef {Object} SummaryLine
 * @property {string} key            Stable category key; also the deep-link focus token.
 * @property {string} label          Plain-language label. Never a bare number.
 * @property {number} count
 * @property {boolean} isNew         Belongs to the "new since last visit" category.
 *
 * @typedef {Object} FeatureSummary
 * @property {string}        featureKey
 * @property {string}        title
 * @property {string|null}   orientation   One short line of context, or null.
 * @property {SummaryLine[]} lines
 * @property {string}        href          Main click destination (all sections).
 * @property {string|null}   aspectKey     Aspect this summary is coloured by.
 * @property {'ready'|'empty'|'restricted'|'error'} status
 * @property {string|null}   statusReason  Member-safe explanation when not 'ready'.
 *
 * @typedef {Object} PlaygroundRepository
 * @property {(viewer: ViewerContext) => Promise<FeatureSummary[]>} findFeatureSummaries
 * @property {(viewer: ViewerContext) => Promise<Object[]>} findCurrentActivity
 * @property {(viewer: ViewerContext) => Promise<Object[]>} findDiscoverySuggestions
 */

const REQUIRED_METHODS = [
  'findFeatureSummaries',
  'findCurrentActivity',
  'findDiscoverySuggestions'
];

module.exports = { REQUIRED_METHODS };
