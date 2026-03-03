require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend Ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegistrationEmail(userEmail, name)
{
    const subject= "Welcome to Backend Ledger"
    const text= `Hi ${name},\n\nThank you for registering at Backend Ledger! We're excited to have you on board.\n\nBest regards,\nThe Backend Ledger Team`
    const html= `<p>Hi ${name},</p><p>Thank you for registering at Backend Ledger! We're excited to have you on board.</p><p>Best regards,<br>The Backend Ledger Team</p>`

    await sendEmail(userEmail,subject,text,html);

}

async function sendTransactionEmail(userEmail, name, amount, fromAccount, toAccount)
{
    const subject= "Transaction Alert : Transaction Successfull"
    const text = `Hi ${name}, \n\n Your transaction of amount ${amount} from account ${fromAccount} to account ${toAccount} has been successfully processed.\n\nBest Regards, \n Backend Ledger Team`

    const html = `<p>Hi ${name},</p><p>Your transaction of amount <b>${amount}</b> from account <b>${fromAccount}</b> to account <b>${toAccount}</b> has been successfully processed.</p><p>Best Regards,<br>Backend Ledger Team</p>`

    await sendEmail(userEmail,subject,text,html);
}

async function sendTransactionFailureEmail(userEmail, name, amount, fromAccount, toAccount)
{
    const subject= "Transaction Alert : Transaction Failed"
    const text = `Hi ${name}, \n\n Your transaction of amount ${amount} from account ${fromAccount} to account ${toAccount} has been failed. Please try again after some time .\n\nBest Regards, \n Backend Ledger Team`

    const html = `<p>Hi ${name},</p><p>Your transaction of amount <b>${amount}</b> from account <b>${fromAccount}</b> to account <b>${toAccount}</b> has been failed.</p><p>Best Regards,<br>Backend Ledger Team</p>`

    await sendEmail(userEmail,subject,text,html);
}

module.exports = {sendEmail, sendRegistrationEmail , sendTransactionEmail, sendTransactionFailureEmail

};