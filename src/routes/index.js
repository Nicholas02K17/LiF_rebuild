'use strict';

const express = require('express');
const hubRoutes = require('./hub.routes');
const placeholderRoutes = require('./placeholder.routes');

const router = express.Router();

router.use(hubRoutes);

/**
 * Every destination the Hub links to answers with a real, reviewable page
 * rather than a 404 or a TODO. A placeholder is an instruction to build a
 * prototype, not permission to leave an empty box
 * (AI Run Instructions v2.1 section 10).
 */
router.use(placeholderRoutes);

module.exports = router;
