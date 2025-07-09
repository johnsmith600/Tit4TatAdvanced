document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const currentRoundSpan = document.getElementById('current-round');
    const totalRoundsSpan = document.getElementById('total-rounds');
    const playerScoreSpan = document.getElementById('player-score');
    const aiScoreSpan = document.getElementById('ai-score');
    const playerLastMoveSpan = document.getElementById('player-last-move');
    const aiLastMoveSpan = document.getElementById('ai-last-move');
    const messageDisplay = document.getElementById('message');
    const cooperateBtn = document.getElementById('cooperate-btn');
    const defectBtn = document.getElementById('defect-btn');
    const resetBtn = document.getElementById('reset-btn');
    const finalResultSection = document.getElementById('final-result-section');
    const finalMessageDisplay = document.getElementById('final-message');
    // New AI strategy displays
    const aiStrategySpan = document.getElementById('ai-strategy');
    const strategyReasonSpan = document.getElementById('strategy-reason');


    // --- Helper Function to Update UI ---
    function updateUI(gameState) {
        currentRoundSpan.textContent = gameState.currentRound;
        totalRoundsSpan.textContent = gameState.TOTAL_ROUNDS;
        playerScoreSpan.textContent = gameState.playerScore;
        aiScoreSpan.textContent = gameState.aiScore;

        const playerLastMove = gameState.playerMovesHistory.length > 0 ? gameState.playerMovesHistory[gameState.playerMovesHistory.length - 1] : null;
        const aiLastMove = gameState.aiMovesHistory.length > 0 ? gameState.aiMovesHistory[gameState.aiMovesHistory.length - 1] : null;

        playerLastMoveSpan.textContent = playerLastMove === null ? 'N/A' : (playerLastMove === 0 ? 'Cooperate' : 'Defect');
        aiLastMoveSpan.textContent = aiLastMove === null ? 'N/A' : (aiLastMove === 0 ? 'Cooperate' : 'Defect');

        messageDisplay.textContent = gameState.message;

        // Update AI strategy display
        aiStrategySpan.textContent = gameState.aiCurrentStrategy.replace(/_/g, ' '); // Make it more readable
        strategyReasonSpan.textContent = gameState.strategyChangeReason;


        if (gameState.gameOver) {
            cooperateBtn.disabled = true;
            defectBtn.disabled = true;
            resetBtn.classList.remove('hidden');
            finalResultSection.classList.remove('hidden');
            finalMessageDisplay.textContent = gameState.finalMessage;
            messageDisplay.classList.add('hidden'); // Hide the round message
        } else {
            cooperateBtn.disabled = false;
            defectBtn.disabled = false;
            resetBtn.classList.add('hidden');
            finalResultSection.classList.add('hidden');
            messageDisplay.classList.remove('hidden'); // Show the round message
        }
    }

    // --- API Calls ---

    /**
     * Fetches the current game state from the server.
     */
    async function fetchGameState() {
        try {
            const response = await fetch('/api/state');
            const gameState = await response.json();
            updateUI(gameState);
        } catch (error) {
            console.error('Error fetching game state:', error);
            messageDisplay.textContent = 'Error loading game. Please try again.';
        }
    }

    /**
     * Sends the player's move to the server.
     * @param {number} move - 0 for Cooperate, 1 for Defect
     */
    async function sendPlayerMove(move) {
        try {
            const response = await fetch('/api/move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ playerMove: move })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Something went wrong with your move.');
            }

            const gameState = await response.json();
            updateUI(gameState);
        } catch (error) {
            console.error('Error sending move:', error);
            messageDisplay.textContent = `Error: ${error.message}`;
        }
    }

    /**
     * Resets the game on the server.
     */
    async function resetGame() {
        try {
            const response = await fetch('/api/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const gameState = await response.json();
            updateUI(gameState);
            messageDisplay.textContent = `Game reset! Play ${gameState.TOTAL_ROUNDS} rounds against the Advanced AI. Make your first move.`;
        } catch (error) {
            console.error('Error resetting game:', error);
            messageDisplay.textContent = 'Error resetting game. Please refresh the page.';
        }
    }

    // --- Event Listeners ---
    cooperateBtn.addEventListener('click', () => sendPlayerMove(0)); // 0 for Cooperate
    defectBtn.addEventListener('click', () => sendPlayerMove(1));   // 1 for Defect
    resetBtn.addEventListener('click', resetGame);

    // Initial load of game state when the page loads
    fetchGameState();
});