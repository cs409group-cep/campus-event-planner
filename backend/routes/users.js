const express = require('express');
const User = require('../models/User');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile with RSVP'd events
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate({
        path: 'rsvpEvents',
        select: 'title description category date time location organizerName rsvps likes',
        populate: {
          path: 'organizer',
          select: 'name email'
        }
      })
      .populate({
        path: 'createdEvents',
        select: 'title description category date time location rsvps likes',
        populate: {
          path: 'organizer',
          select: 'name email'
        }
      })
      .populate({
        path: 'likedEvents',
        select: 'title description category date time location organizerName rsvps likes',
        populate: {
          path: 'organizer',
          select: 'name email'
        }
      });

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate({
        path: 'rsvpEvents',
        select: 'title description category date time location organizerName rsvps likes',
        populate: {
          path: 'organizer',
          select: 'name email'
        }
      })
      .populate({
        path: 'createdEvents',
        select: 'title description category date time location rsvps likes',
        populate: {
          path: 'organizer',
          select: 'name email'
        }
      })
      .populate({
        path: 'likedEvents',
        select: 'title description category date time location organizerName rsvps likes',
        populate: {
          path: 'organizer',
          select: 'name email'
        }
      });

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;

