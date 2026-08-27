'use strict';

const express = require('express');
const hubRoutes = require('./hub.routes');
const featureRoutes = require('./features.routes');
const placeholderRoutes = require('./placeholder.routes');

const router = express.Router();

router.use(hubRoutes);

/**
 * The built feature pages come before the placeholder table, so a destination
 * that now exists is served by its own controller rather than by the
 * "not built yet" prototype it used to fall through to.
 */
router.use(featureRoutes);

/**
 * Every destination the Hub links to answers with a real, reviewable page
 * rather than a 404 or a TODO. A placeholder is an instruction to build a
 * prototype, not permission to leave an empty box
 * (AI Run Instructions v2.1 section 10).
 */
router.use(placeholderRoutes);

module.exports = router;
