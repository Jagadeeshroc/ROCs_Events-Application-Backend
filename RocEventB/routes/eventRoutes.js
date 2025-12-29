const express = require('express');
const router = express.Router();
const { createEvent, getEvents, getEventById,deleteEvent, rsvpEvent } = require('../controllers/eventController');
const auth = require('../middleware/authMiddleware');

router.get('/', getEvents); // Public: View events
router.post('/', auth, createEvent); // Protected: Create event
router.get('/:id', getEventById);
router.delete('/:id', auth, deleteEvent);
router.post('/:id/rsvp', auth, rsvpEvent); // Protected: Join event

module.exports = router;