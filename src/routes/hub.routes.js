'use strict';

const express = require('express');
const hubController = require('../controllers/hub.controller');

/**
 * Routes map HTTP methods and URLs to controllers. No business rules and no
 * data access live here (AI Run Instructions v2.1 section 5.1).
 */
const router = express.Router();

router.get('/', hubController.show);

router.post('/my-playground/layout', hubController.saveLayout);
router.post('/my-playground/layout/restore', hubController.restoreLayout);
router.post('/my-playground/theme', hubController.saveAspectTheme);

module.exports = router;
