const nodemailer = require('nodemailer');

// Create transporter - configure with your email service
// For development, you can use Gmail, or services like SendGrid, Mailgun, etc.
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email service not configured. Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in .env');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendEventReminder = async (userEmail, userName, event) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.error('Email transporter not available');
    return false;
  }

  try {
    const eventDate = new Date(event.eventDate);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mailOptions = {
      from: `"EventEase" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Reminder: ${event.eventTitle} is coming up!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .event-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #4F46E5; }
            .event-title { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 15px; }
            .detail { margin: 10px 0; }
            .detail-label { font-weight: bold; color: #6b7280; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Event Reminder</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>This is a reminder about an upcoming event you've RSVP'd to:</p>
              
              <div class="event-details">
                <div class="event-title">${event.eventTitle}</div>
                <div class="detail">
                  <span class="detail-label">Date:</span> ${formattedDate}
                </div>
                <div class="detail">
                  <span class="detail-label">Time:</span> ${event.time}
                </div>
                <div class="detail">
                  <span class="detail-label">Location:</span> ${event.location}
                </div>
              </div>
              
              <p>We hope to see you there!</p>
              <p>Best regards,<br>The EventEase Team</p>
            </div>
            <div class="footer">
              <p>This is an automated reminder from EventEase</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Reminder: ${event.eventTitle} is coming up!
        
        Hi ${userName},
        
        This is a reminder about an upcoming event you've RSVP'd to:
        
        ${event.eventTitle}
        Date: ${formattedDate}
        Time: ${event.time}
        Location: ${event.location}
        
        We hope to see you there!
        
        Best regards,
        The EventEase Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Reminder email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return false;
  }
};

module.exports = {
  sendEventReminder
};

