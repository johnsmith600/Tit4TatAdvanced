# Tit for Tat Dilemma Game: Advanced Adaptive AI

Dive into the classic **Iterated Prisoner's Dilemma** with a challenging twist! This web-based game pits your strategic thinking against a highly advanced, unpredictable AI opponent.

## About The Game

The Iterated Prisoner's Dilemma is a fundamental concept in game theory, exploring cooperation and betrayal. Our AI takes this to the next level. It's not just following a fixed rule; it's a dynamic, adaptive meta-strategy AI that learns and reacts to your play in real-time.

**Can you outsmart a machine that constantly changes its mind?**

## AI's Capabilities (The "Advanced" Part)

This AI employs a sophisticated meta-strategy, dynamically switching between various well-known game theory tactics based on several factors:

* **Diverse Strategies:** It can adopt "personalities" like:
    * **Tit for Tat (TFT):** Cooperate, then mirror your last move.
    * **Forgiving Tit for Tat (FTFT):** TFT, but occasionally forgives your defections.
    * **Grudger (Win-Stay, Lose-Shift):** Sticks to a move if it was rewarding, or switches if it was punishing.
    * **Always Cooperate (AC):** Always tries to cooperate.
    * **Always Defect (AD):** Always tries to betray.
    * **Random (RND):** Purely unpredictable.
* **Adaptive Learning:**
    * **Game Phase Awareness:** Adjusts its approach depending on whether it's the early, mid, or late game.
    * **Score-Based Adaptation:** Becomes more aggressive if it's losing significantly, or more lenient/exploitative if it's winning.
    * **Player Pattern Recognition:** Analyzes your recent moves (e.g., if you're consistently cooperating or defecting) to inform its next strategic shift.
* **Dynamic Decision-Making:** Its behavior is genuinely hard to predict because it's not following one static algorithm, but rather a flexible decision-making tree combined with internal strategic randomization.

## Technologies Used

* **Backend:** Node.js with Express.js (for game logic and API)
* **Frontend:** HTML, CSS (with a "vibeful" aesthetic!), and JavaScript (for the interactive UI)

## Features

* **Adaptive AI Opponent:** Experience a truly dynamic challenge.
* **Web-Based UI:** Play directly in your browser with a clean, engaging design.
* **Intuitive Gameplay:** Simple "Cooperate" or "Defect" choices.
* **Real-time Score Tracking:** See your progress round by round.
* **Dynamic Messaging:** Get feedback on AI's current strategy and rationale.
* **Responsive Design:** Play comfortably on various screen sizes.

## How to Play (Locally)

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/tit-for-tat-dilemma.git](https://github.com/YOUR_USERNAME/tit-for-tat-dilemma.git)
    cd tit-for-tat-dilemma
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Start the server:**
    ```bash
    node server.js
    ```
4.  **Open your browser** and navigate to `http://localhost:3000`.

## Contribution

Feel free to fork this repository, experiment with the AI logic, or enhance the UI!

---
