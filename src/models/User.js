const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    emergencyContactEmail: { type: String, required: true }
}, { timestamps: true });


module.exports = mongoose.models.User || mongoose.model('User', userSchema);