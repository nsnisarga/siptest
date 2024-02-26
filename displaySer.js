const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring'); // Used for generating OTPs

const app = express();
app.use(express.json());

// MongoDB connection setup (replace 'your_database_url' with your MongoDB connection string)
mongoose.connect('your_database_url', { useNewUrlParser: true, useUnifiedTopology: true });

// Define MongoDB Order Schema
const orderSchema = new mongoose.Schema({
  invoiceId: String,
  userId: String,
  status: String, // 'pending', 'delivered', etc.
  paymentDetails: {
    cardNumber: String,
    // Add other payment details as needed
  },
});

const Order = mongoose.model('Order', orderSchema);

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your_email@gmail.com', // Replace with your email
    pass: 'your_email_password',  // Replace with your email password or an app-specific password
  },
});

// Generate OTP function
const generateOTP = () => {
  return randomstring.generate({ length: 6, charset: 'numeric' });
};

// Display orders based on the user and their respective statuses
app.get('/user-orders/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const orders = await Order.find({ userId });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Confirm order delivery and send OTP for verification
app.post('/confirm-delivery/:invoiceId', async (req, res) => {
  const invoiceId = req.params.invoiceId;
  const { otp, userEmail } = req.body;

  try {
    const order = await Order.findOne({ invoiceId });

    // Check if the OTP matches
    if (otp === order.deliveryOTP) {
      // Update order status to 'delivered'
      order.status = 'delivered';
      await order.save();

      // Send confirmation email
      const mailOptions = {
        from: 'your_email@gmail.com', // Replace with your email
        to: userEmail,
        subject: 'Order Delivered Confirmation',
        text: 'Your order has been delivered successfully.',
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });

      res.json({ message: 'Order delivered and confirmed successfully.' });
    } else {
      res.status(400).json({ error: 'Invalid OTP' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
