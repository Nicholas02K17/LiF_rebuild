'use strict';

const { listAspects, seedOfLife, getAspect } = require('../content/aspects');
const features = require('../config/features');

/**
 * Explicit view model.
 *
 * Templates receive only what is on this object. Unrestricted records never
 * reach a template (AI Run Instructions v2.1 section 5.1), which is also why
 * every field here is either derived, labelled or already permission-checked.
 */

function navigationFor() {
  /* Each destination carries the Aspect it belongs to, so the rail bullets are
     the seven Aspect colours rather than seven identical grey dots. Colours are
     connected to the Aspects, not assigned to features
     (Brand Reference v1.1 section 3) — this is the Aspect showing through, not
     a feature colour scheme. */
  const items = [
    { key: 'hub', label: 'My Playground', href: '/', always: true, aspectKey: 'whole-human-potential' },
    { key: 'events', label: 'Gatherings', href: '/gatherings', aspectKey: 'service-offerings' },
    { key: 'groups', label: 'Groups', href: '/groups', aspectKey: 'community-inclusion' },
    { key: 'connections', label: 'Connections', href: '/connections', aspectKey: 'engagement-communion' },
    { key: 'calendar', label: 'Calendar', href: '/calendar', aspectKey: 'presence-being' },
    { key: 'map', label: 'Map', href: '/map', aspectKey: 'nature-nurture' },
    { key: 'resources', label: 'Resources', href: '/resources', aspectKey: 'nature-nurture' },
    { key: 'opportunities', label: 'Opportunities', href: '/opportunities', aspectKey: 'source-resources' }
  ];

  /**
   * Hidden CARDS never remove a feature from navigation — only the
   * administrator disabling the feature does (Shared Foundation v1.4 section 7).
   */
  return items
    .filter((item) => item.always || features.isVisible(item.key))
    .map((item) => ({
      ...item,
      comingSoon: !item.always && features.stateOf(item.key) === 'coming-soon'
    }));
}

function build(hub, { t, requestPath, reviewState }) {
  const themeAspect = hub.identity.aspectThemeKey ? getAspect(hub.identity.aspectThemeKey) : null;
  const filterAspect = hub.aspectFilterKey ? getAspect(hub.aspectFilterKey) : null;

  const visibleSummaries = hub.summaries.filter((s) => !s.hidden);
  const hiddenSummaries = hub.summaries.filter((s) => s.hidden);

  return {
    page: {
      title: `${t('brand.hub')} — ${t('brand.name')}`,
      path: requestPath,
      reviewState: reviewState || null
    },

    identity: {
      playgroundName: hub.identity.playgroundName,
      country: hub.identity.country,
      initial: hub.identity.playgroundName.trim().charAt(0).toUpperCase(),
      isFirstVisit: hub.isFirstVisit
    },

    welcome: {
      greeting: hub.isFirstVisit
        ? t('welcome.home')
        : t('welcome.returning', { name: hub.identity.playgroundName }),
      orientation: t('welcome.orientation'),
      returnToIntent: hub.returnToIntent
    },

    pathway: {
      ...hub.pathway,
      title: t('welcome.pathwayTitle'),
      intro: t('welcome.pathwayIntro'),
      completeMessage: t('welcome.pathwayComplete'),
      minimized: Boolean(hub.preference.pathwayMinimized),
      minimizeLabel: t('welcome.pathwayMinimize'),
      reopenLabel: t('welcome.pathwayReopen')
    },

    scope: {
      current: hub.scope,
      forMeLabel: t('scope.forMe'),
      wholeLabel: t('scope.wholePlayground'),
      explanation: hub.scope === 'for-me' ? t('scope.explainForMe') : t('scope.explainWhole')
    },

    aspects: {
      all: listAspects(),
      seed: seedOfLife(),
      themeKey: themeAspect ? themeAspect.key : null,
      themeLabel: themeAspect ? themeAspect.label : null,
      filterKey: filterAspect ? filterAspect.key : null,
      filterLabel: filterAspect ? filterAspect.label : null,
      filterCaption: t('aspect.filterCaption'),
      clearLabel: t('aspect.clear'),
      themesEnabled: features.isActive('memberThemes')
    },

    activity: hub.activity,
    suggestions: hub.suggestions,

    cards: {
      visible: visibleSummaries,
      hidden: hiddenSummaries,
      restoreLabel: t('action.restoreLayout'),
      hideLabel: t('action.hideCard'),
      showLabel: t('action.showCard'),
      viewAllLabel: t('action.viewAll'),
      newLabel: t('newSinceLastVisit')
    },

    navigation: navigationFor(),

    states: {
      loading: t('state.loading'),
      emptyNothingYet: t('state.emptyNothingYet'),
      emptyNoMatches: t('state.emptyNoMatches'),
      emptyNothingNew: t('state.emptyNothingNew'),
      notYetAvailable: t('state.notYetAvailable'),
      restricted: t('state.restricted'),
      error: t('state.error'),
      errorRetry: t('state.errorRetry'),
      saved: t('state.savedIndicator')
    }
  };
}

module.exports = { build, navigationFor };
