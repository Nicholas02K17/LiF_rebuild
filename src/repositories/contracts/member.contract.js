'use strict';

/**
 * MemberRepository contract.
 *
 * Authoritative entities: MemberAccount, MemberIdentity, MemberFieldVisibility,
 * OnboardingPathway, OnboardingComponentStatus, DashboardPreference
 * (Dashboard Unified v1.2 §15).
 *
 * @typedef {Object} MemberIdentity
 * @property {string}  id                 Stable member ID.
 * @property {string}  playgroundName     Always public.
 * @property {string}  country            Always public.
 * @property {string|null} city           Required for I Am Here; visibility is member-chosen.
 * @property {string}  preferredLanguage  BCP-47 tag.
 * @property {string|null} aspectThemeKey Chosen Aspect theme, or null for the standard theme.
 * @property {string|null} lastVisitAt    ISO timestamp of the previous visit.
 *
 * @typedef {Object} PathwayComponentStatus
 * @property {string}  key                'i-am-here' | 'what-interests-me' | 'connection-my-way' | 'welcome-home-gathering' | 'explore-the-playground'
 * @property {boolean} complete
 * @property {boolean} required           Only I Am Here gates participation actions.
 * @property {string|null} completedAt
 *
 * @typedef {Object} MemberRepository
 * @property {(memberId: string) => Promise<MemberIdentity|null>} findIdentity
 * @property {(memberId: string) => Promise<PathwayComponentStatus[]>} findPathwayStatus
 * @property {(memberId: string) => Promise<{order: string[], hidden: string[], pathwayMinimized: boolean, scope: 'for-me'|'whole-playground'}>} findDashboardPreference
 * @property {(memberId: string, patch: Object) => Promise<Object>} saveDashboardPreference
 * @property {(memberId: string, aspectKey: string|null) => Promise<MemberIdentity>} saveAspectTheme
 * @property {(memberId: string) => Promise<void>} touchLastVisit
 */

const REQUIRED_METHODS = [
  'findIdentity',
  'findPathwayStatus',
  'findDashboardPreference',
  'saveDashboardPreference',
  'saveAspectTheme',
  'touchLastVisit'
];

module.exports = { REQUIRED_METHODS };
