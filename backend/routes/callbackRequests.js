const express = require('express');
const router = express.Router();
const CallbackRequest = require('../models/CallbackRequest');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/admin');

// Submit callback request (Public route)
router.post('/callback-request', async (req, res) => {
  try {
    const { name, phone, message } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone number. Must be 10 digits.' });
    }

    // Create callback request
    const callbackRequest = new CallbackRequest({
      name,
      phone,
      message: message || '',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    await callbackRequest.save();

    res.status(201).json({
      message: 'Callback request submitted successfully',
      id: callbackRequest._id
    });
  } catch (error) {
    console.error('Error creating callback request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all callback requests (Admin only)
router.get('/admin/callback-requests', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const requests = await CallbackRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update callback request status (Admin only)
router.put('/admin/callback-requests/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const request = await CallbackRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Callback request not found' });
    }

    if (status) request.status = status;
    if (notes) request.notes = notes;
    
    if (status === 'contacted' && !request.contactedAt) {
      request.contactedAt = new Date();
    }

    await request.save();

    res.json({ 
      message: 'Callback request updated',
      request 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete callback request (Admin only)
router.delete('/admin/callback-requests/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await CallbackRequest.findByIdAndDelete(id);

    res.json({ message: 'Callback request deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
