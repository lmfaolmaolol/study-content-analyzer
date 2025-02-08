const { GoogleGenerativeAI } = require("@google/generative-ai");

// Separate the prompt template for better maintainability
const ANALYSIS_PROMPT_TEMPLATE = `Analyze the text and return ONLY a valid JSON object with this EXACT structure:

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
1. Return ONLY valid JSON without any formatting or markdown
2. Ensure proper JSON escaping for quotes and special characters
3. Keep each content under 100 characters
4. Use only basic ASCII characters
5. Include 1-3 entries per category
6. Do not add any explanation text

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
            maxOutputTokens: 2048
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
        let jsonText = result.response.text().trim();
        
        // Log raw response for debugging
        console.log('Raw response:', jsonText);

        // Remove markdown code blocks if present
        jsonText = jsonText
            .replace(/^```json/g, '')
            .replace(/```$/g, '')
            .trim();

        // Handle case where response has text wrapping the JSON
        const jsonMatch = jsonText.match(/(\{[\s\S]*\})/);
        if (!jsonMatch) {
            console.error('JSON match failed. Full response:', jsonText);
            throw new Error('No valid JSON object found in response');
        }
        jsonText = jsonMatch[1];

        // Improved cleaning pipeline
        jsonText = jsonText
            .replace(/\\\"/g, '"')         // Unescape quotes
            .replace(/[\u0000-\u001F]/g, '') // Remove control chars
            .replace(/(\\n|\\t)/g, ' ')     // Replace escaped whitespace
            .replace(/\s+/g, ' ')          // Normalize whitespace
            .trim();

        // Validate JSON structure before parsing
        if (!jsonText.startsWith('{') || !jsonText.endsWith('}')) {
            console.error('Invalid JSON boundaries:', jsonText);
            throw new Error('Malformed JSON response');
        }

        console.log('Final cleaned JSON:', jsonText);  // Debug log

        // Parse with reviver for safety
        let analysisResult;
        try {
            analysisResult = JSON.parse(jsonText, (k, v) => {
                if (typeof v === 'string') {
                    return v.replace(/[\u0000-\u001F]/g, '');
                }
                return v;
            });
        } catch (parseError) {
            console.error('JSON parse error:', parseError.message);
            console.error('Failed JSON text:', jsonText);
            throw new Error('Failed to parse valid JSON from response');
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