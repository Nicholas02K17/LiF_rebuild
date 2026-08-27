'use strict';

const express = require('express');
const asyncRoute = require('../middleware/asyncRoute');
const controller = require('../controllers/features.controller');

/**
 * The feature pages.
 *
 * Routes map URLs to controllers and nothing else — no rules, no data access
 * (AI Run Instructions v2.1 section 5.1). Every handler is async, so every one
 * goes through asyncRoute; a rejection that escapes here would take the process
 * down rather than return a 500.
 *
 * Detail routes are registered after their list route so a literal path is
 * never shadowed by a parameter.
 */
const router = express.Router();

router.get('/gatherings', asyncRoute(controller.gatherings));
router.get('/gatherings/:slug', asyncRoute(controller.gathering));

router.get('/groups', asyncRoute(controller.groups));
router.get('/groups/:slug', asyncRoute(controller.group));

router.get('/connections', asyncRoute(controller.connections));
router.get('/calendar', asyncRoute(controller.calendar));
router.get('/map', asyncRoute(controller.map));

router.get('/resources', asyncRoute(controller.resources));
router.get('/opportunities', asyncRoute(controller.opportunities));

module.exports = router;
