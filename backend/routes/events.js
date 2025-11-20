const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Event = require('../models/Event');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Helper: combine event.date and event.time into a single Date object
function getEventDateTime(event) {
  if (!event) return null;
  let d = null;
  try {
    d = event.date ? new Date(event.date) : null;
    if (!d || isNaN(d.getTime())) d = null;
  } catch (e) {
    d = null;
  }

  if (event.time && typeof event.time === 'string') {
    const m = event.time.match(/(\d{1,2}):(\d{2})/);
    if (m) {
      const hh = parseInt(m[1], 10);
      const mm = parseInt(m[2], 10);
      if (!d) d = new Date();
      d.setHours(hh, mm, 0, 0);
    }
  }

  return d;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   GET /api/events
// @desc    Get all events with optional filters
// @access  Public
router.get('/', [
  query('category').optional().isIn(['academic', 'social', 'sports', 'cultural', 'fundraiser', 'concert', 'workshop', 'other']),
  query('date').optional().isISO8601(),
  query('search').optional().isString()
], async (req, res) => {
  try {
    const { category, date, search, includePast } = req.query;
    const wantPast = includePast === '1' || includePast === 'true' || includePast === 'on' || includePast === true;
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    } else {
      // Only show future events by default (unless includePast requested)
      if (!wantPast) {
        filter.date = { $gte: new Date() };
      }
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Use aggregation to sort by RSVP count and likes count
    const events = await Event.aggregate([
      { $match: filter },
      {
        $addFields: {
          rsvpCount: { $size: { $ifNull: ['$rsvps', []] } },
          likeCount: { $size: { $ifNull: ['$likes', []] } }
        }
      },
      { $sort: { rsvpCount: -1, likeCount: -1, date: 1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: 'users',
          localField: 'organizer',
          foreignField: '_id',
          as: 'organizer'
        }
      },
      {
        $unwind: {
          path: '$organizer',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          'organizer.password': 0
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'rsvps',
          foreignField: '_id',
          as: 'rsvps'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'likes',
          foreignField: '_id',
          as: 'likes'
        }
      },
      {
        $project: {
          rsvpCount: 0,
          likeCount: 0
        }
      }
    ]);

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error fetching events' });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email')
      .populate('rsvps', 'name email')
      .populate('likes', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error fetching event' });
  }
});

// @route   POST /api/events
// @desc    Create a new event
// @access  Private
router.post('/', auth, upload.single('image'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isIn(['academic', 'social', 'sports', 'cultural', 'fundraiser', 'concert', 'workshop', 'other']).withMessage('Invalid category'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').notEmpty().withMessage('Time is required'),
  body('location').trim().notEmpty().withMessage('Location is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, category, date, time, location } = req.body;

    // Handle image: uploaded file or URL
    let imageUrl = '';
    if (req.file) {
      // If file was uploaded, generate URL
      imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    } else if (req.body.imageUrl) {
      // Fallback to text URL if provided
      imageUrl = req.body.imageUrl;
    }

    const event = new Event({
      title,
      description,
      category,
      date,
      time,
      location,
      organizer: req.user._id,
      organizerName: req.user.name,
      imageUrl: imageUrl
    });

    await event.save();

    // Add to user's created events
    await User.findByIdAndUpdate(req.user._id, {
      $push: { createdEvents: event._id }
    });

    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'name email')
      .populate('rsvps', 'name')
      .populate('likes', 'name');

    res.status(201).json(populatedEvent);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error creating event' });
  }
});

// @route   POST /api/events/:id/rsvp
// @desc    RSVP to an event
// @access  Private
router.post('/:id/rsvp', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Prevent RSVPs for past events
    const eventDateTime = getEventDateTime(event);
    if (eventDateTime && eventDateTime.getTime() < Date.now()) {
      return res.status(400).json({ message: 'Cannot RSVP to past events' });
    }

    // Check if already RSVP'd
    if (event.rsvps.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already RSVP\'d to this event' });
    }

    // Add RSVP
    event.rsvps.push(req.user._id);
    await event.save();

    // Add to user's RSVP list
    await User.findByIdAndUpdate(req.user._id, {
      $push: { rsvpEvents: event._id }
    });

    res.json({ message: 'RSVP successful', event });
  } catch (error) {
    console.error('RSVP error:', error);
    res.status(500).json({ message: 'Server error processing RSVP' });
  }
});

// @route   DELETE /api/events/:id/rsvp
// @desc    Cancel RSVP to an event
// @access  Private
router.delete('/:id/rsvp', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Remove RSVP
    event.rsvps = event.rsvps.filter(id => id.toString() !== req.user._id.toString());
    await event.save();

    // Remove from user's RSVP list
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { rsvpEvents: event._id }
    });

    // Remove reminder if exists
    const Reminder = require('../models/Reminder');
    await Reminder.findOneAndDelete({
      user: req.user._id,
      event: event._id
    });

    res.json({ message: 'RSVP cancelled', event });
  } catch (error) {
    console.error('Cancel RSVP error:', error);
    res.status(500).json({ message: 'Server error cancelling RSVP' });
  }
});

// @route   PUT /api/events/:id
// @desc    Update an event
// @access  Private (own events only)
router.put('/:id', auth, upload.single('image'), [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('category').optional().isIn(['academic', 'social', 'sports', 'cultural', 'fundraiser', 'concert', 'workshop', 'other']).withMessage('Invalid category'),
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('time').optional().notEmpty().withMessage('Time cannot be empty'),
  body('location').optional().trim().notEmpty().withMessage('Location cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

      // Prevent editing events that originate from an external source (read-only)
      if (event.externalSource) {
        return res.status(403).json({ message: 'Official/external events cannot be edited' });
      }

    // Check if user is the organizer
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this event' });
    }

    const { title, description, category, date, time, location } = req.body;
    
    if (title) event.title = title;
    if (description) event.description = description;
    if (category) event.category = category;
    if (date) event.date = date;
    if (time) event.time = time;
    if (location) event.location = location;
    
    // Handle image: uploaded file or URL
    if (req.file) {
      // Delete old image if it was uploaded to our server
      if (event.imageUrl && event.imageUrl.includes('/uploads/')) {
        const oldFilename = event.imageUrl.split('/uploads/')[1];
        const oldFilePath = path.join(__dirname, '..', 'uploads', oldFilename);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      // Set new image URL
      event.imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    } else if (req.body.imageUrl !== undefined) {
      event.imageUrl = req.body.imageUrl;
    }

    await event.save();

    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'name email')
      .populate('rsvps', 'name email')
      .populate('likes', 'name email');

    res.json(populatedEvent);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error updating event' });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event
// @access  Private (own events only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Prevent deleting events that originate from an external source (read-only)
    if (event.externalSource) {
      return res.status(403).json({ message: 'Official/external events cannot be deleted' });
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    // Remove from user's created events
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { createdEvents: event._id }
    });

    // Remove from all users' RSVP lists
    await User.updateMany(
      { rsvpEvents: event._id },
      { $pull: { rsvpEvents: event._id } }
    );

    // Remove from all users' liked events lists
    await User.updateMany(
      { likedEvents: event._id },
      { $pull: { likedEvents: event._id } }
    );

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error deleting event' });
  }
});

// @route   POST /api/events/:id/like
// @desc    Like an event
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if already liked
    if (event.likes.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already liked this event' });
    }

    // Add like
    event.likes.push(req.user._id);
    await event.save();

    // Add to user's liked events
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { likedEvents: event._id }
    });

    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'name email')
      .populate('rsvps', 'name email')
      .populate('likes', 'name email');

    res.json({ message: 'Event liked', event: populatedEvent });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ message: 'Server error processing like' });
  }
});

// @route   DELETE /api/events/:id/like
// @desc    Unlike an event
// @access  Private
router.delete('/:id/like', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Remove like
    event.likes = event.likes.filter(id => id.toString() !== req.user._id.toString());
    await event.save();

    // Remove from user's liked events
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { likedEvents: event._id }
    });

    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'name email')
      .populate('rsvps', 'name email')
      .populate('likes', 'name email');

    res.json({ message: 'Event unliked', event: populatedEvent });
  } catch (error) {
    console.error('Unlike error:', error);
    res.status(500).json({ message: 'Server error processing unlike' });
  }
});

module.exports = router;

