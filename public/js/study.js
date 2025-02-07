// No requires or Node.js specific code at the top!

// Constants
const CATEGORIES = ['procedural', 'analogous', 'conceptual', 'evidence', 'reference'];

// DOM Elements
let elements;

// Initialize DOM elements after content loads
function initializeElements() {
    elements = {
        analyzeBtn: document.getElementById('analyze-btn'),
        clearBtn: document.getElementById('clear-btn'),
        studyText: document.getElementById('study-text'),
        youtubeUrl: document.getElementById('youtube-url'),
        errorContainer: document.getElementById('error-container'),
        loadingIndicator: document.getElementById('loading-indicator'),
        tabBtns: document.querySelectorAll('.tab-btn'),
        tabContents: document.querySelectorAll('.tab-content'),
        resultsContainer: document.querySelector('.results-container')
    };
}

// Toggle section visibility
function toggleSection(sectionId) {
    const content = document.getElementById(`${sectionId}-content`);
    if (!content) return;
    
    const header = content.previousElementSibling;
    const isCollapsed = content.style.display === 'none';
    content.style.display = isCollapsed ? 'flex' : 'none';
    header.classList.toggle('collapsed', !isCollapsed);
}

// Create content card
function createContentCard(content, strategy) {
    return `
        <div class="content-card" draggable="true">
            <div class="content-text">${content}</div>
            <div class="strategy">💡 ${strategy}</div>
        </div>
    `;
}

// Display error message
function showError(message) {
    if (elements.errorContainer) {
        elements.errorContainer.textContent = message;
        elements.errorContainer.style.display = 'block';
        setTimeout(() => {
            elements.errorContainer.style.display = 'none';
        }, 5000);
    }
}

// Show/hide loading indicator
function toggleLoading(show) {
    elements.loadingIndicator.style.display = show ? 'block' : 'none';
    elements.analyzeBtn.disabled = show;
    elements.analyzeBtn.textContent = show ? 'Analyzing...' : 'Analyze Content';
}

// Handle tab switching
function handleTabSwitch(event) {
    const targetTab = event.target.dataset.tab;
    if (!targetTab) return;

    elements.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === targetTab);
    });

    elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${targetTab}-tab`);
    });
}

// Clear all inputs and results
function clearInputs() {
    elements.studyText.value = '';
    elements.youtubeUrl.value = '';
    CATEGORIES.forEach(category => {
        const contentElement = document.getElementById(`${category}-content`);
        if (contentElement) {
            contentElement.innerHTML = '';
            contentElement.style.display = 'none';
        }
    });
}

// Initialize drag and drop
function initDragAndDrop() {
    const cards = document.querySelectorAll('.content-card');
    const columns = document.querySelectorAll('.category-content');

    cards.forEach(card => {
        card.addEventListener('dragstart', () => card.classList.add('dragging'));
        card.addEventListener('dragend', () => card.classList.remove('dragging'));
    });

    columns.forEach(column => {
        column.addEventListener('dragover', e => {
            e.preventDefault();
            const card = document.querySelector('.dragging');
            if (card) {
                const afterCard = getDropPosition(column, e.clientY);
                afterCard ? column.insertBefore(card, afterCard) : column.appendChild(card);
            }
        });
    });
}

// Calculate drop position
function getDropPosition(column, y) {
    const cards = [...column.querySelectorAll('.content-card:not(.dragging)')];
    return cards.reduce((closest, card) => {
        const box = card.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        return offset < 0 && offset > closest.offset ? { offset, element: card } : closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Update UI with analysis results
function updateUIWithAnalysis(data) {
    console.log('Updating UI with data:', data);
    
    CATEGORIES.forEach(category => {
        const contentElement = document.getElementById(`${category}-content`);
        if (!contentElement) {
            console.error(`Element not found: ${category}-content`);
            return;
        }

        if (!Array.isArray(data[category])) {
            console.error(`Invalid data for category ${category}:`, data[category]);
            return;
        }

        const content = data[category]
            .map(item => createContentCard(
                item.content || 'No content',
                item.strategy || 'No strategy'
            ))
            .join('');

        contentElement.innerHTML = content || '<div class="empty-message">No entries for this category</div>';
        contentElement.style.display = 'flex';
        contentElement.previousElementSibling.classList.remove('collapsed');
    });

    initDragAndDrop();
    elements.resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Handle analysis submission
async function handleAnalysis() {
    const text = elements.studyText.value.trim();
    const youtubeUrl = elements.youtubeUrl.value.trim();

    if (!text && !youtubeUrl) {
        showError('Please enter either text or a YouTube URL');
        return;
    }

    toggleLoading(true);

    try {
        const response = await fetch('/api/study/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, youtubeUrl })
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Analysis failed');
        }

        if (!result.data) {
            throw new Error('No analysis data received');
        }

        console.log('Analysis result:', result);
        updateUIWithAnalysis(result.data);
    } catch (error) {
        console.error('Analysis error:', error);
        showError(error.message);
    } finally {
        toggleLoading(false);
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    
    // Set up event listeners
    elements.analyzeBtn.addEventListener('click', handleAnalysis);
    elements.clearBtn.addEventListener('click', clearInputs);
    elements.tabBtns.forEach(btn => btn.addEventListener('click', handleTabSwitch));
    
    // Initialize tab content visibility
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
    document.getElementById(`${activeTab}-tab`).classList.add('active');
}); 