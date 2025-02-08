const express = require('express');
const router = express.Router();
const { analyzeTextUsingGemini } = require('../utils/geminiClient');
const { getYoutubeTranscript } = require('../utils/youtubeClient');
const StudyContent = require('../models/StudyContent');

// Validation middleware
const validateInput = (req, res, next) => {
    const { text, youtubeUrl } = req.body;
    
    // Validate text input
    if (text && typeof text !== 'string') {
        return res.status(400).json({ 
            success: false,
            error: 'Text input must be a string'
        });
    }
    
    // Validate YouTube URL
    if (youtubeUrl) {
        try {
            const url = new URL(youtubeUrl);
            if (!['www.youtube.com', 'youtube.com', 'youtu.be'].includes(url.hostname)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid YouTube URL'
                });
            }
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: 'Invalid URL format'
            });
        }
    }
    
    // Validate content length
    if (text && text.length > 10000) {
        return res.status(400).json({
            success: false,
            error: 'Text input too long (max 10,000 characters)'
        });
    }
    
    next();
};

// Helper function to preprocess text
function preprocessText(text) {
    try {
        if (!text || typeof text !== 'string') {
            throw new Error('Invalid text input');
        }
        return text.trim();
    } catch (error) {
        console.error('Error preprocessing text:', error);
        throw error;
    }
}

// Helper function to check environment variables
function checkEnvironmentVariables() {
    const requiredVars = ['GEMINI_API_KEY', 'MONGODB_URI'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
}

// Text analysis endpoint
router.post('/analyze', validateInput, async (req, res) => {
    console.log('Received analysis request');
    
    try {
        // Check environment variables first
        checkEnvironmentVariables();

        const { text, youtubeUrl } = req.body;
        let contentToAnalyze;
        let sourceType;
        let sourceUrl = null;

        // Input validation
        if (!text && !youtubeUrl) {
            throw new Error('Either text or YouTube URL must be provided');
        }

        if (text && youtubeUrl) {
            throw new Error('Please provide either text or YouTube URL, not both');
        }

        // Process based on input type
        if (youtubeUrl) {
            console.log('Processing YouTube URL:', youtubeUrl);
            sourceType = 'youtube';
            sourceUrl = youtubeUrl;
            contentToAnalyze = await getYoutubeTranscript(youtubeUrl);
        } else {
            console.log('Processing text input');
            sourceType = 'text';
            contentToAnalyze = preprocessText(text);
        }

        if (!contentToAnalyze) {
            throw new Error('Failed to process input content');
        }

        // Truncate long text
        if (contentToAnalyze.length > 15000) {
            console.log('Truncating long text input');
            contentToAnalyze = contentToAnalyze.substring(0, 15000) + '...';
        }

        // Analyze content
        console.log('Analyzing content...');
        const analysis = await analyzeTextUsingGemini(contentToAnalyze);
        
        // Log the analysis result for debugging
        console.log('Analysis result:', JSON.stringify(analysis, null, 2));

        // Save to database
        console.log('Saving analysis to database...');
        const studyContent = new StudyContent({
            originalContent: contentToAnalyze,
            sourceType,
            sourceUrl,
            analysis: {
                procedural: analysis.procedural || [],
                analogous: analysis.analogous || [],
                conceptual: analysis.conceptual || [],
                evidence: analysis.evidence || [],
                reference: analysis.reference || []
            }
        });

        await studyContent.save();
        console.log('Analysis saved successfully');

        // Send response with the same structure as the frontend expects
        res.json({
            success: true,
            data: {
                originalText: contentToAnalyze,
                procedural: analysis.procedural || [],
                analogous: analysis.analogous || [],
                conceptual: analysis.conceptual || [],
                evidence: analysis.evidence || [],
                reference: analysis.reference || []
            }
        });
    } catch (error) {
        console.error('Error in /analyze endpoint:', error);
        
        // Determine appropriate error message and status
        let statusCode = 500;
        let errorMessage = 'An unexpected error occurred';

        if (error.message.includes('Invalid YouTube URL') || 
            error.message.includes('Invalid text input') ||
            error.message.includes('either text or YouTube URL')) {
            statusCode = 400;
            errorMessage = error.message;
        } else if (error.message.includes('GEMINI_API_KEY')) {
            statusCode = 503;
            errorMessage = 'Text analysis service is currently unavailable';
        } else if (error.message.includes('MONGODB_URI')) {
            statusCode = 503;
            errorMessage = 'Database service is currently unavailable';
        }

        res.status(statusCode).json({
            success: false,
            error: errorMessage
        });
    }
});

module.exports = router;