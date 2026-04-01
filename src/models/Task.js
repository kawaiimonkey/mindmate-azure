const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: 'User' },
    title: { type: String, required: true },
    subtitle: { type: String },
    status: { type: String, enum: ['pending', 'done'], default: 'pending' },
    dueDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.models.Task || mongoose.model('Task', taskSchema);