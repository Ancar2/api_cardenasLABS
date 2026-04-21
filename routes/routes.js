const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const projectRoutes = require('./project.routes');
const reviewRoutes = require('./review.routes');
const leadRoutes = require('./lead.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/reviews', reviewRoutes);
router.use('/leads', leadRoutes);

module.exports = router;
