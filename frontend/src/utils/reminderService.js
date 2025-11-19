// Reminder service to check and trigger reminders
export const checkReminders = () => {
  if (!('Notification' in window)) {
    return
  }

  // Request permission if not already granted/denied
  if (Notification.permission === 'default') {
    Notification.requestPermission()
  }

  const reminders = JSON.parse(localStorage.getItem('eventReminders') || '{}')
  const now = new Date()
  
  Object.keys(reminders).forEach((key) => {
    const reminder = reminders[key]
    const reminderTime = new Date(reminder.reminderTime)
    
    // Check if reminder time has passed but not more than 1 hour ago
    const timeDiff = now.getTime() - reminderTime.getTime()
    const oneHour = 60 * 60 * 1000
    
    if (timeDiff >= 0 && timeDiff < oneHour) {
      // Check if we've already shown this notification (prevent duplicates)
      const notificationKey = `notified_${key}`
      if (!localStorage.getItem(notificationKey)) {
        if (Notification.permission === 'granted') {
          new Notification(`Reminder: ${reminder.eventTitle}`, {
            body: `The event "${reminder.eventTitle}" is starting soon at ${reminder.location}`,
            icon: '/favicon.ico',
            tag: `event-${reminder.eventId}`,
            requireInteraction: true
          })
          // Mark as notified
          localStorage.setItem(notificationKey, 'true')
        }
      }
    } else if (timeDiff > oneHour) {
      // Remove old reminders (more than 1 hour past reminder time)
      delete reminders[key]
      localStorage.removeItem(`notified_${key}`)
    }
  })
  
  localStorage.setItem('eventReminders', JSON.stringify(reminders))
}

// Schedule future reminders
export const scheduleReminder = (reminderTime, event) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return
  }

  const now = new Date()
  const timeUntilReminder = reminderTime.getTime() - now.getTime()
  
  if (timeUntilReminder > 0 && timeUntilReminder < 24 * 60 * 60 * 1000) {
    // Only schedule if reminder is within 24 hours
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification(`Reminder: ${event.title}`, {
          body: `The event "${event.title}" is starting in 1 hour at ${event.location}`,
          icon: '/favicon.ico',
          tag: `event-${event._id || event.id}`,
          requireInteraction: true
        })
      }
    }, timeUntilReminder)
  }
}

// Initialize reminder checking on app load
export const initReminderService = () => {
  // Check reminders immediately
  checkReminders()
  
  // Check reminders every minute
  setInterval(checkReminders, 60 * 1000)
}

