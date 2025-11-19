const express = require('express');
const Reminder = require('../models/Reminder');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/reminders/:eventId
// @desc    Set reminder for an event
// @access  Private
router.post('/:eventId', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user has RSVP'd
    const hasRsvp = event.rsvps.some(rsvp => rsvp.toString() === req.user._id.toString());
    if (!hasRsvp) {
      return res.status(400).json({ message: 'You must RSVP to the event before setting a reminder' });
    }

    // Create or update reminder
    const reminder = await Reminder.findOneAndUpdate(
      { user: req.user._id, event: event._id },
      {
        user: req.user._id,
        event: event._id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        location: event.location,
        reminder1DaySent: false,
        reminder2HoursSent: false
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Reminder set successfully', reminder });
  } catch (error) {
    console.error('Set reminder error:', error);
    res.status(500).json({ message: 'Server error setting reminder' });
  }
});

// @route   DELETE /api/reminders/:eventId
// @desc    Remove reminder for an event
// @access  Private
router.delete('/:eventId', auth, async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({
      user: req.user._id,
      event: req.params.eventId
    });

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    res.json({ message: 'Reminder removed successfully' });
  } catch (error) {
    console.error('Remove reminder error:', error);
    res.status(500).json({ message: 'Server error removing reminder' });
  }
});

// @route   GET /api/reminders
// @desc    Get all reminders for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user._id })
      .populate('event', 'title date time location category')
      .sort({ eventDate: 1 });

    res.json(reminders);
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ message: 'Server error fetching reminders' });
  }
});

module.exports = router;

