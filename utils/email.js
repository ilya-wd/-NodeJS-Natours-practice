const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
// const { htmlToText } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url; // can be a reset url to reset a password
    this.from = `Jonas Schmedtmann  ${process.env.EMAIL_FROM}`;
    // this.from =
    //   process.env.NODE_ENV === 'development'
    //     ? `Jonas Schmedtmann  ${process.env.EMAIL_FROM_PROD}`
    //     : `Jonas Schmedtmann  ${process.env.EMAIL_FROM}`;
  }

  // in production -real emails. Not in production - mailtrap
  // this function is only concerned about sending an email
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return nodemailer.createTransport({
        // nodemailer already knows the port of the sendgrid
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    // Otherwise...
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Send the actual email
  // Passing in template names eg "welcome"
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    // Creating HTML out of template to send it
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject, // defined already - passed in the method
      html, // defined already - const above
      text: htmlToText.fromString(html),
      // text: htmlToText(html),
    };

    // 3) craete a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};

// const sendEmail = async (options) => {
//   // 1) Create a transporter
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//     // Activate in gmail "less secure app" option
//   });

//   // 2) Define the email options
//   const mailOptions = {
//     from: 'Jonas Schmedtmann <hello@jonas.com>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     //html:
//   };

//   // 3) Actually send the email
//   // Not storing any results
//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;
