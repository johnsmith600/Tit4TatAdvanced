const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Game Configuration ---
const TOTAL_ROUNDS = 200; // Even more rounds to allow complex strategies to unfold
const HISTORY_LENGTH = 40; // How many past moves to remember for analysis

// Payoff matrix for (Player 1, Player 2) based on (P1's choice, P2's choice)
// Choices: 0 = Cooperate, 1 = Defect
const PAYOFF_MATRIX = {
    '00': [3, 3], // P1 C, P2 C (Reward)
    '01': [0, 5], // P1 C, P2 D (Sucker's Payoff for P1, Temptation for P2)
    '10': [5, 0], // P1 D, P2 C (Temptation for P1, Sucker's Payoff for P2)
    '11': [1, 1]  // P1 D, P2 D (Punishment)
};

// --- AI Strategy Definitions ---
const AI_STRATEGIES = {
    TIT_FOR_TAT: 'TIT_FOR_TAT',
    FORGIVING_TFT: 'FORGIVING_TFT',
    GRUDGER: 'GRUDGER', // Win-Stay, Lose-Shift
    ALWAYS_COOPERATE: 'ALWAYS_COOPERATE',
    ALWAYS_DEFECT: 'ALWAYS_DEFECT',
    RANDOM: 'RANDOM',
};

// --- Game State (Managed on the server) ---
let gameState = {
    currentRound: 1,
    playerScore: 0,
    aiScore: 0,
    playerMovesHistory: [], // Array of 0s and 1s
    aiMovesHistory: [],     // Array of 0s and 1s
    message: `Welcome! Play ${TOTAL_ROUNDS} rounds against the Advanced AI.`,
    gameOver: false,
    finalMessage: "",
    aiCurrentStrategy: AI_STRATEGIES.TIT_FOR_TAT, // Initial strategy
    strategyChangeReason: ""
};

// --- Middleware ---
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Game Functions (Server-side) ---

/**
 * Resets the game state to its initial values.
 */
function resetGame() {
    gameState = {
        currentRound: 1,
        playerScore: 0,
        aiScore: 0,
        playerMovesHistory: [],
        aiMovesHistory: [],
        message: `Welcome! Play ${TOTAL_ROUNDS} rounds against the Advanced AI.`,
        gameOver: false,
        finalMessage: "",
        aiCurrentStrategy: AI_STRATEGIES.TIT_FOR_TAT,
        strategyChangeReason: ""
    };
}

/**
 * AI's decision-making functions for each strategy type.
 */

// Player's last move: gameState.playerMovesHistory[gameState.playerMovesHistory.length - 1]
// AI's last move: gameState.aiMovesHistory[gameState.aiMovesHistory.length - 1]

function getTfTMove() {
    if (gameState.currentRound === 1) return 0; // Cooperate
    return gameState.playerMovesHistory[gameState.playerMovesHistory.length - 1]; // Mirror
}

function getForgivingTfTMove(forgiveChance = 0.2) { // 20% chance to forgive
    if (gameState.currentRound === 1) return 0;
    const playerLastMove = gameState.playerMovesHistory[gameState.playerMovesHistory.length - 1];
    if (playerLastMove === 1 && Math.random() < forgiveChance) { // Player defected, consider forgiving
        return 0; // Forgive
    }
    return playerLastMove; // Mirror
}

function getGrudgerMove() {
    if (gameState.currentRound === 1) return 0; // Start with cooperate

    const playerLastMove = gameState.playerMovesHistory[gameState.playerMovesHistory.length - 1];
    const aiLastMove = gameState.aiMovesHistory[gameState.aiMovesHistory.length - 1];
    const [playerPoints, aiPoints] = PAYOFF_MATRIX[`${playerLastMove}${aiLastMove}`]; // NOTE: This is incorrect for Grudger, it should be based on previous round's outcome from AI's perspective
    // Grudger (Win-Stay, Lose-Shift): If previous round outcome was good, keep last move. If bad, switch.
    // "Good" for AI: getting 3 (mutual C), or 5 (exploiting D)
    // "Bad" for AI: getting 0 (being suckered), or 1 (mutual D)

    const lastOutcomeKey = `${aiLastMove}${playerLastMove}`; // AI's move, then player's move
    const [_, aiLastRoundPoints] = PAYOFF_MATRIX[lastOutcomeKey];

    // Win-Stay, Lose-Shift
    // If AI got 3 or 5 points last round (good outcome), it keeps its last move.
    // If AI got 0 or 1 points last round (bad outcome), it switches its last move.
    if (aiLastRoundPoints >= 3) { // Good outcome (3 or 5 points)
        return aiLastMove; // Stay with the same move
    } else { // Bad outcome (0 or 1 points)
        return 1 - aiLastMove; // Switch move (0 to 1, 1 to 0)
    }
}


function getAlwaysCooperateMove() {
    return 0; // Cooperate
}

function getAlwaysDefectMove() {
    return 1; // Defect
}

function getRandomMove() {
    return Math.random() < 0.5 ? 0 : 1; // 50/50
}

/**
 * The core Meta-Strategy AI logic. Decides which sub-strategy to use.
 */
function getAdvancedAiMove() {
    // Current score difference (positive means player is winning)
    const scoreDiff = gameState.playerScore - gameState.aiScore;
    const roundsLeft = TOTAL_ROUNDS - gameState.currentRound + 1;
    let newStrategy = gameState.aiCurrentStrategy;
    let reason = "Maintaining current strategy.";

    // --- Strategy Switching Logic ---

    // 1. Initial Rounds / Establishing Baseline
    if (gameState.currentRound <= 3) {
        newStrategy = AI_STRATEGIES.TIT_FOR_TAT;
        reason = "Early game, trying to establish cooperation.";
    }
    // 2. Mid-Game Adaptations
    else if (gameState.currentRound <= TOTAL_ROUNDS * 0.7) { // Up to 70% of rounds
        if (scoreDiff > 10) { // Player is significantly winning
            newStrategy = AI_STRATEGIES.ALWAYS_DEFECT; // Go aggressive
            reason = "Player is winning significantly, switching to Always Defect!";
        } else if (scoreDiff < -10) { // AI is significantly winning
            // If AI is winning, sometimes exploit, sometimes be benevolent to draw cooperation
            if (Math.random() < 0.6) { // 60% chance to go Forgiving TFT
                 newStrategy = AI_STRATEGIES.FORGIVING_TFT;
                 reason = "AI is winning, trying Forgiving Tit for Tat.";
            } else { // 40% chance to be a bit exploitative
                 newStrategy = AI_STRATEGIES.GRUDGER; // Grudger can be exploitative
                 reason = "AI is winning, trying Grudger strategy.";
            }
        } else { // Scores are relatively close
            // Randomly pick a cooperative/mirroring strategy
            const strategies = [AI_STRATEGIES.TIT_FOR_TAT, AI_STRATEGIES.FORGIVING_TFT, AI_STRATEGIES.GRUDGER];
            newStrategy = strategies[Math.floor(Math.random() * strategies.length)];
            reason = `Scores close, trying a dynamic strategy: ${newStrategy}.`;
        }

        // Check for player's recent behavior
        const recentPlayerMoves = gameState.playerMovesHistory.slice(-HISTORY_LENGTH);
        const playerDefectCount = recentPlayerMoves.filter(move => move === 1).length;
        const playerCoopCount = recentPlayerMoves.filter(move => move === 0).length;

        if (recentPlayerMoves.length === HISTORY_LENGTH) {
            if (playerDefectCount >= HISTORY_LENGTH * 0.8) { // Player mostly defecting recently
                newStrategy = AI_STRATEGIES.ALWAYS_DEFECT;
                reason = "Player is consistently defecting, AI retaliating with Always Defect!";
            } else if (playerCoopCount >= HISTORY_LENGTH * 0.8) { // Player mostly cooperating recently
                if (Math.random() < 0.5) { // 50% chance to exploit cooperation
                    newStrategy = AI_STRATEGIES.ALWAYS_DEFECT;
                    reason = "Player is consistently cooperating, AI trying to exploit!";
                } else { // 50% chance to reciprocate cooperation
                    newStrategy = AI_STRATEGIES.FORGIVING_TFT;
                    reason = "Player is consistently cooperating, AI reciprocating with Forgiving Tit for Tat.";
                }
            }
        }

    }
    // 3. Late Game
    else { // Last 30% of rounds
        if (scoreDiff > 0) { // Player winning
            newStrategy = AI_STRATEGIES.ALWAYS_DEFECT; // Desperate measures
            reason = "Late game, player is winning, AI resorting to Always Defect!";
        } else if (scoreDiff < 0) { // AI winning
            newStrategy = AI_STRATEGIES.ALWAYS_DEFECT; // Secure the win aggressively
            reason = "Late game, AI is winning, securing win with Always Defect.";
        } else { // Tie or close
            newStrategy = AI_STRATEGIES.RANDOM; // Introduce chaos
            reason = "Late game, scores are tied, AI going random!";
        }
    }

    // Assign the determined strategy
    gameState.aiCurrentStrategy = newStrategy;
    gameState.strategyChangeReason = reason;

    // Execute the chosen strategy
    switch (gameState.aiCurrentStrategy) {
        case AI_STRATEGIES.TIT_FOR_TAT:
            return getTfTMove();
        case AI_STRATEGIES.FORGIVING_TFT:
            return getForgivingTfTMove(0.3); // Higher forgiveness in general for this variant
        case AI_STRATEGIES.GRUDGER:
            return getGrudgerMove();
        case AI_STRATEGIES.ALWAYS_COOPERATE:
            return getAlwaysCooperateMove();
        case AI_STRATEGIES.ALWAYS_DEFECT:
            return getAlwaysDefectMove();
        case AI_STRATEGIES.RANDOM:
            return getRandomMove();
        default:
            return getTfTMove(); // Fallback
    }
}

/**
 * Calculates scores for the current round.
 * @param {number} playerMove - Human player's move (0 or 1)
 * @param {number} aiMove - AI's move (0 or 1)
 * @returns {Array<number>} [playerPoints, aiPoints] for the round
 */
function calculateScores(playerMove, aiMove) {
    const key = `${playerMove}${aiMove}`;
    return PAYOFF_MATRIX[key];
}

// --- API Endpoints ---

app.get('/api/state', (req, res) => {
    res.json({ ...gameState, TOTAL_ROUNDS });
});

app.post('/api/move', (req, res) => {
    if (gameState.gameOver || gameState.currentRound > TOTAL_ROUNDS) {
        gameState.gameOver = true;
        gameState.finalMessage = gameState.finalMessage || `Game over. ${gameState.playerScore > gameState.aiScore ? 'You won!' : (gameState.aiScore > gameState.playerScore ? 'AI won!' : 'It\'s a tie!')}`;
        return res.status(400).json({ message: "Game is over. Please reset to play again.", ...gameState, TOTAL_ROUNDS });
    }

    const { playerMove } = req.body;
    if (playerMove === undefined || (playerMove !== 0 && playerMove !== 1)) {
        return res.status(400).json({ message: "Invalid move. Must be 0 (Cooperate) or 1 (Defect).", ...gameState, TOTAL_ROUNDS });
    }

    // Get AI's move using the advanced logic
    const aiMove = getAdvancedAiMove();

    // Store moves before calculating scores and incrementing round
    gameState.playerMovesHistory.push(playerMove);
    gameState.aiMovesHistory.push(aiMove);

    const [playerPoints, aiPoints] = calculateScores(playerMove, aiMove);

    gameState.playerScore += playerPoints;
    gameState.aiScore += aiPoints;

    let roundMessage = `You chose to ${playerMove === 0 ? 'Cooperate' : 'Defect'}. The AI chose to ${aiMove === 0 ? 'Cooperate' : 'Defect'}.`;
    roundMessage += ` You gained ${playerPoints} points. AI gained ${aiPoints} points.`;
    gameState.message = roundMessage;

    gameState.currentRound++;

    if (gameState.currentRound > TOTAL_ROUNDS) {
        gameState.gameOver = true;
        if (gameState.playerScore > gameState.aiScore) {
            gameState.finalMessage = 'Congratulations! You outsmarted the Advanced AI!';
        } else if (gameState.aiScore > gameState.playerScore) {
            gameState.finalMessage = 'The Advanced AI proved to be an incredibly formidable opponent!';
        } else {
            gameState.finalMessage = 'It\'s a hard-fought tie against the Advanced AI!';
        }
    }

    res.json({ ...gameState, TOTAL_ROUNDS });
});

app.post('/api/reset', (req, res) => {
    resetGame();
    res.json({ ...gameState, TOTAL_ROUNDS });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Tit for Tat Web Game server listening on http://localhost:${PORT}`);
    console.log('Open your browser and navigate to this address.');
});