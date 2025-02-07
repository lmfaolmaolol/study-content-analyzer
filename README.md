# Study Content Analyzer

A web application that helps analyze and categorize study content using Google's Gemini AI. The app breaks down text or YouTube video transcripts into different learning categories to enhance understanding and retention.

## Features

- **Text Analysis**: Analyze any study text and break it down into learning categories
- **YouTube Integration**: Extract and analyze transcripts from YouTube videos
- **Learning Categories**:
  - Procedural Knowledge: Step-by-step instructions and processes
  - Analogous Knowledge: Comparisons and metaphors
  - Conceptual Knowledge: Core ideas and theories
  - Evidence: Examples and demonstrations
  - Reference Information: Technical terms and definitions
- **Interactive UI**: Drag-and-drop interface for organizing content
- **Learning Strategies**: Each piece of content comes with a suggested learning strategy
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **AI**: Google Gemini API
- **Additional APIs**: YouTube Transcript API

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Google Gemini API key
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/study-planner.git
   cd study-planner
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   PORT=3000
   NODE_ENV=development
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000` in your browser

## Usage

1. Enter study text or paste a YouTube URL
2. Click "Analyze Content"
3. View the categorized results
4. Drag and drop content cards to reorganize
5. Use the suggested learning strategies to improve retention

## API Endpoints

### POST /api/study/analyze
Analyzes text or YouTube video content

**Request Body:**
```json
{
  "text": "content to analyze",
  // OR
  "youtubeUrl": "https://www.youtube.com/watch?v=..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "originalText": "...",
    "procedural": [...],
    "analogous": [...],
    "conceptual": [...],
    "evidence": [...],
    "reference": [...]
  }
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Google Gemini API for text analysis
- YouTube Transcript API for video transcription
- MongoDB Atlas for database hosting 