const mongoose = require('mongoose');

const alertLogSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: 'User' },
    contactedEmail: { type: String, required: true },
    triggerReason: { type: String, required: true },
    sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.AlertLog || mongoose.model('AlertLog', alertLogSchema);