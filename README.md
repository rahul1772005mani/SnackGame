# Marvel Edition Nokia 3310 Snake Game

A high-fidelity retro simulator of the iconic Nokia 3310 running a custom **Marvel Edition Snake game**. It combines a monochrome LCD screen aesthetic with customizable Marvel "Xpress-on" covers, hero-themed pixel canvas rendering, and monophonic Web Audio API sound waves.

🎮 **[PLAY LIVE ON VERCEL](https://nokia-marvel-snake.vercel.app/)**

---

## 🌟 Features

*   **Xpress-on Covers**: Click selectors at the top to swap the visual phone cover, LCD screen color system, and gameplay sprites dynamically.
    *   🕷️ **Spider-Man**: Red/blue matte casing, web segment snake path, and Spider-Bot food.
    *   🚀 **Iron Man**: Red/gold casing, stark tech plasma trailing snake, and Arc Reactor food.
    *   ⚡ **Thor**: Slate/silver casing, lightning-chain snake path, and Mjolnir Hammer food.
    *   ⭐ **Captain America**: Patriotic blue/red casing, striped shield snake path, and Star food.
    *   📞 **Classic**: Standard dark navy retro casing, classic monochrome display, and square block snake.
*   **Web Audio API Synth**: Custom-synthesized 8-bit sounds customized per hero:
    *   *Spider-Man*: Web-swinging zips (rising sweeps).
    *   *Iron Man*: Repulsor charge (sawtooth swells).
    *   *Thor*: Crashing thunder (rumble decays).
    *   *Captain America*: Shield ricochets (triangle pitch sweeps).
*   **Interactive Keypad & Keys**: Clicking physical simulator keys (numbers, menus, scroll) steer the snake and control menus. Keyboard inputs (WASD, Arrows, Enter, Escape) are also fully supported.
*   **Screen Looping**: Boundary/border collisions wrap the snake to the opposite side of the screen. You only lose when you collide with your own body (self-collision)!
*   **S.H.I.E.L.D. Leaderboard**: Stores and displays high scores for each character independently using `localStorage`.

---

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/rahul1772005mani/SnackGame.git
    cd SnackGame
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Running Locally

Start the local server:
```bash
npm run dev
```

Open your browser and navigate to:
👉 **[http://localhost:3310](http://localhost:3310)**

---

## 🎮 Controls

*   **Steering**: `Arrow Keys` or `W` `A` `S` `D` (or simulator keys **2**, **4**, **6**, **8**).
*   **Select / Start / Pause**: `Enter` or `Space` (or simulator key **5** / **Menu**).
*   **Go Back / Exit**: `Escape` or `Backspace` (or simulator key **C** / **0**).
*   **Mute Audio**: Press `M` (or click the sound button on the left panel).

---

## 🧪 Running E2E Tests

The project includes a Playwright E2E browser testing suite validating menu navigation, skin changes, game loops, screen looping, and self-collision detection.

Run the test suite:
```bash
npm test
```
