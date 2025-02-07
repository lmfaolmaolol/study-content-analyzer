const mongoose = require('mongoose');

const studyContentSchema = new mongoose.Schema({
    originalContent: {
        type: String,
        required: true
    },
    sourceType: {
        type: String,
        enum: ['text', 'youtube'],
        required: true
    },
    sourceUrl: {
        type: String,
        required: function() {
            return this.sourceType === 'youtube';
        }
    },
    analysis: {
        procedural: [{
            content: String,
            strategy: String
        }],
        analogous: [{
            content: String,
            strategy: String
        }],
        conceptual: [{
            content: String,
            strategy: String
        }],
        evidence: [{
            content: String,
            strategy: String
        }],
        reference: [{
            content: String,
            strategy: String
        }]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('StudyContent', studyContentSchema);