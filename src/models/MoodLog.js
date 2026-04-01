const mongoose = require('mongoose');

const moodLogSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: 'User' },
    score: { type: Number, required: true, min: 0, max: 100 },
    emotionTag: { type: String, required: true },
    date: { type: String, required: true } 
}, { timestamps: true });

module.exports = mongoose.models.MoodLog || mongoose.model('MoodLog', moodLogSchema);