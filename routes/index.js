const express = require('express');
const authorize = require('../configs/authorize');
var router = express.Router();

const authRouter = require('./auth.js');
const indicationRouter = require('./indication.js');
const landscapeRouter = require('./landscape.js');
const objectionRouter = require('./objection.js');
const trainingRouter = require('./training.js');

router.use('/auth', authRouter);
router.use('/indication', indicationRouter);
router.use('/landscape', landscapeRouter);
router.use('/objection', objectionRouter);
router.use('/training', trainingRouter);


module.exports = router;