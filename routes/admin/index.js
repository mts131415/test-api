const express = require('express');
const authorize = require('../../configs/authorize');
var router = express.Router();

const authRouter = require('./auth.js');
const indicationRouter = require('./indication.js');
const landscapeRouter = require('./landscape.js');
const trainingRouter = require('./training.js');
const objectionRouter = require('./objection.js');
const memberRouter = require('./member.js');

router.use('/auth', authRouter);
router.use('/indication', indicationRouter);
router.use('/landscape', landscapeRouter);
router.use('/training', trainingRouter);
router.use('/objection', objectionRouter);
router.use('/member', memberRouter);

module.exports = router;