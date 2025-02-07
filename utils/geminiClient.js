const { GoogleGenerativeAI } = require("@google/generative-ai");

// Separate the prompt template for better maintainability
const ANALYSIS_PROMPT_TEMPLATE = `Analyze the text and return a JSON object with this EXACT structure:

{
  "originalText": "{text}",
  "procedural": [
    {
      "content": "Step-by-step instruction from text",
      "strategy": "How to learn this"
    }
  ],
  "analogous": [
    {
      "content": "Comparison or metaphor from text",
      "strategy": "How to remember this"
    }
  ],
  "conceptual": [
    {
      "content": "Core concept from text",
      "strategy": "How to understand this"
    }
  ],
  "evidence": [
    {
      "content": "Example from text",
      "strategy": "How to verify this"
    }
  ],
  "reference": [
    {
      "content": "Technical term from text",
      "strategy": "How to memorize this"
    }
  ]
}

Rules:
1. Return ONLY the JSON object above
2. Keep each content under 100 characters
3. Use only basic ASCII characters
4. Include 1-3 entries per category
5. Do not add any explanation text

Text to analyze: {text}`;

async function analyzeTextUsingGemini(text) {
    try {
        console.log('Initializing Gemini API...');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const generationConfig = {
            temperature: 0.1,
            topP: 0.1,
            topK: 16,
            maxOutputTokens: 2048,
            stopSequences: ["\n\n", "```"]
        };

        console.log('Sending request to Gemini API...');
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: ANALYSIS_PROMPT_TEMPLATE.replace('{text}', text) }]}],
            generationConfig,
        });

        if (!result || !result.response) {
            throw new Error('Empty response from Gemini API');
        }

        console.log('Received response from Gemini API');
        let responseText = result.response.text().trim();
        
        // Log raw response for debugging
        console.log('Raw response:', responseText);

        // Try to extract JSON
        let jsonText = responseText;
        
        // If response contains multiple JSON objects, take the first complete one
        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonText = responseText.substring(firstBrace, lastBrace + 1);
        } else {
            throw new Error('No valid JSON object found in response');
        }

        // Clean up the JSON string
        jsonText = jsonText
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')  // Remove control chars
            .replace(/\\[^"\\\/bfnrtu]/g, '')              // Remove invalid escapes
            .replace(/([^\\])"/g, '$1\\"')                 // Escape unescaped quotes
            .replace(/^\\"/, '"')                          // Fix first quote if escaped
            .replace(/\\"/g, '"')                          // Normalize quotes
            .replace(/\s+/g, ' ')                          // Normalize whitespace
            .trim();

        // Try to parse the cleaned JSON
        let analysisResult;
        try {
            analysisResult = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('First parse attempt failed:', parseError);
            console.error('Attempted to parse:', jsonText);
            
            // Try more aggressive cleaning if first attempt fails
            jsonText = jsonText.replace(/[^\x20-\x7E]/g, '');
            try {
                analysisResult = JSON.parse(jsonText);
            } catch (e) {
                console.error('Second parse attempt failed:', e);
                throw new Error('Failed to parse Gemini response as JSON');
            }
        }

        // Validate and ensure required fields
        const requiredCategories = ['procedural', 'analogous', 'conceptual', 'evidence', 'reference'];
        requiredCategories.forEach(category => {
            if (!analysisResult[category] || !Array.isArray(analysisResult[category])) {
                analysisResult[category] = [];
            }

            // Clean and validate entries
            analysisResult[category] = analysisResult[category]
                .filter(entry => entry && typeof entry === 'object')
                .map(entry => ({
                    content: String(entry.content || '').slice(0, 100),
                    strategy: String(entry.strategy || '').slice(0, 100)
                }))
                .slice(0, 3);
        });

        // Ensure originalText exists
        analysisResult.originalText = analysisResult.originalText || text;

        return analysisResult;

    } catch (error) {
        console.error('Error analyzing text:', error);
        return {
            originalText: text,
            procedural: [],
            analogous: [],
            conceptual: [],
            evidence: [],
            reference: [],
            error: error.message
        };
    }
}

// Helper function to create a fallback response
function createFallbackResponse(text) {
    return {
        originalText: text,
        procedural: [],
        analogous: [],
        conceptual: [],
        evidence: [],
        reference: []
    };
}

module.exports = {
    analyzeTextUsingGemini
}; 