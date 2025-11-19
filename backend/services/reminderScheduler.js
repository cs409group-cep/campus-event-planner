const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const { sendEventReminder } = require('./emailService');

// Run every hour to check for reminders
const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    
    // Calculate time windows
    // 1 day before: events happening between 23-25 hours from now
    const oneDayBeforeStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const oneDayBeforeEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    
    // 2 hours before: events happening between 1.5-2.5 hours from now
    const twoHoursBeforeStart = new Date(now.getTime() + 90 * 60 * 1000);
    const twoHoursBeforeEnd = new Date(now.getTime() + 150 * 60 * 1000);
    
    // Check for 1-day reminders
    const oneDayReminders = await Reminder.find({
      eventDate: {
        $gte: oneDayBeforeStart,
        $lte: oneDayBeforeEnd
      },
      reminder1DaySent: false
    }).populate('user', 'email name');
    
    for (const reminder of oneDayReminders) {
      if (reminder.user && reminder.user.email) {
        const sent = await sendEventReminder(
          reminder.user.email,
          reminder.user.name,
          {
            eventTitle: reminder.eventTitle,
            eventDate: reminder.eventDate,
            time: reminder.eventTime,
            location: reminder.location
          }
        );
        
        if (sent) {
          reminder.reminder1DaySent = true;
          await reminder.save();
        }
      }
    }
    
    // Check for 2-hour reminders
    const twoHourReminders = await Reminder.find({
      eventDate: {
        $gte: twoHoursBeforeStart,
        $lte: twoHoursBeforeEnd
      },
      reminder2HoursSent: false
    }).populate('user', 'email name');
    
    for (const reminder of twoHourReminders) {
      if (reminder.user && reminder.user.email) {
        const sent = await sendEventReminder(
          reminder.user.email,
          reminder.user.name,
          {
            eventTitle: reminder.eventTitle,
            eventDate: reminder.eventDate,
            time: reminder.eventTime,
            location: reminder.location
          }
        );
        
        if (sent) {
          reminder.reminder2HoursSent = true;
          await reminder.save();
        }
      }
    }
    
    console.log(`Checked reminders at ${now.toISOString()}`);
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
};

// Start the scheduler
const startScheduler = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', checkAndSendReminders);
  console.log('Reminder scheduler started - checking every hour');
  
  // Also run immediately on startup
  checkAndSendReminders();
};

module.exports = {
  startScheduler,
  checkAndSendReminders
};

