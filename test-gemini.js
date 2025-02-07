require('dotenv').config();
const { analyzeTextUsingGemini } = require('./utils/geminiClient');

async function testGeminiAPI() {
    const sampleText = "This is a sample text for testing the Gemini API segregation. It contains example study content on various topics.";
    try {
        console.log("Testing Gemini API with sample text:\n", sampleText);
        const result = await analyzeTextUsingGemini(sampleText);
        console.log("Gemini API test response:", result);
    } catch (err) {
        console.error("Error testing Gemini API:", err);
    }
}

testGeminiAPI(); 