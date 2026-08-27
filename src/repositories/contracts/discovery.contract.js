'use strict';

/**
 * DiscoveryRepository contract.
 *
 * Shared Foundation v1.4 §8 asks for ONE discovery layer behind Events, Groups,
 * Members, Resources, Opportunities, the Calendar and the Map — not a separate
 * search per feature. This is that seam.
 *
 * Rules every implementation must hold, whatever the store underneath:
 *
 *  - Search reads authorized indexed data only. Private text, unpublished
 *    values, snippets and match reasons that could expose them are excluded.
 *  - A result opens the authoritative feature record, never a view-specific
 *    duplicate.
 *  - Counts are computed after authorization, so a private object's existence
 *    is never inferable from a total, a cluster or an "Online" count.
 *  - Physical results carry a general area only. An exact postal code or
 *    coordinate never reaches a viewer (Map Human Mapping v1.2 §5).
 *  - Online-only offerings carry no map position and are surfaced through the
 *    Online count instead.
 *
 * @typedef {Object} DiscoveryQuery
 * @property {string|null}  memberId
 * @property {boolean}      isMember
 * @property {'for-me'|'whole-playground'} scope
 * @property {string|null}  search          Free text over approved fields only.
 * @property {string|null}  aspectKey       One of the seven Aspects.
 * @property {string|null}  format          'in-person' | 'online' | 'hybrid'
 * @property {string|null}  language
 * @property {boolean}      onlyNew         "New since last visit" as a filter.
 *
 * @typedef {Object} DiscoveryResult
 * @property {Object[]} items               Already authorized and shaped.
 * @property {number}   total               Authorized matches, not all records.
 * @property {number}   onlineCount         Online-only matches, for the Map panel.
 * @property {number}   newCount            Matches new since the last visit.
 *
 * @typedef {Object} DiscoveryRepository
 * @property {(q: DiscoveryQuery) => Promise<DiscoveryResult>} findEvents
 * @property {(q: DiscoveryQuery) => Promise<DiscoveryResult>} findGroups
 * @property {(q: DiscoveryQuery) => Promise<DiscoveryResult>} findMembers
 * @property {(q: DiscoveryQuery) => Promise<DiscoveryResult>} findResources
 * @property {(q: DiscoveryQuery) => Promise<DiscoveryResult>} findOpportunities
 * @property {(slug: string, viewer: Object) => Promise<Object|null>} findEvent
 * @property {(slug: string, viewer: Object) => Promise<Object|null>} findGroup
 * @property {(viewer: Object) => Promise<Object>} findConnections
 */

const REQUIRED_METHODS = [
  'findEvents',
  'findGroups',
  'findMembers',
  'findResources',
  'findOpportunities',
  'findEvent',
  'findGroup',
  'findConnections'
];

module.exports = { REQUIRED_METHODS };
