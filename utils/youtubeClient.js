const { YoutubeTranscript } = require('youtube-transcript');

async function getYoutubeTranscript(videoUrl) {
    try {
        // Extract video ID from URL
        const videoId = extractVideoId(videoUrl);
        if (!videoId) {
            throw new Error('Invalid YouTube URL');
        }

        // Get transcript
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        
        // Convert transcript array to readable text
        return transcript
            .map(item => item.text)
            .join(' ')
            .trim();
    } catch (error) {
        console.error('Failed to fetch YouTube transcript:', error);
        throw new Error(`Failed to fetch video transcript: ${error.message}`);
    }
}

function extractVideoId(url) {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('youtube.com')) {
            return urlObj.searchParams.get('v');
        } else if (urlObj.hostname.includes('youtu.be')) {
            return urlObj.pathname.slice(1);
        }
    } catch (error) {
        return null;
    }
    return null;
}

module.exports = {
    getYoutubeTranscript
}; 