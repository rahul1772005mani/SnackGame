/* ==========================================================================
   MARVEL EDITION NOKIA 3310 SNAKE GAME - GAME LOGIC & SOUND SYNTHESIS
   ========================================================================== */

// 1. Theme Configuration
const THEME_CONFIGS = {
  classic: {
    name: "CLASSIC SNAKE",
    desc: "The original monochrome snake game. Steer around, eat food, grow longer, and avoid hitting the walls or yourself.",
    pixelTheme: "Standard Monochrome",
    skinClass: "skin-classic",
    displayName: "SNAK"
  },
  spiderman: {
    name: "SPIDER-MAN",
    desc: "Steer Spidey's web-spinning path. Hunt down the rogue Spider-Bots before they infiltrate the grid!",
    pixelTheme: "Spidey Red & Blue",
    skinClass: "skin-spiderman",
    displayName: "SPIDY"
  },
  ironman: {
    name: "IRON MAN",
    desc: "Pilot Tony's jet-trail path. Power up by collecting glowing Arc Reactors to charge the repulsors!",
    pixelTheme: "Stark Tech Gold",
    skinClass: "skin-ironman",
    displayName: "IRON"
  },
  thor: {
    name: "THOR",
    desc: "Channel the power of the lightning chain. Command Mjolnir to summon crashing thunder notes!",
    pixelTheme: "Asgard Slate Blue",
    skinClass: "skin-thor",
    displayName: "THOR"
  },
  capamerica: {
    name: "CAPTAIN AMERICA",
    desc: "Throw the shield and trace its trajectory. Retrieve the Captain's Stars to defend liberty!",
    pixelTheme: "Patriotic Shield Blue",
    skinClass: "skin-capamerica",
    displayName: "CAPT"
  }
};

// 2. 5x5 Food Pixel Sprites
const SPRITES = {
  classic: [
    [0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0]
  ],
  spiderman: [
    [1, 0, 1, 0, 1],
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [1, 0, 1, 0, 1]
  ],
  ironman: [
    [0, 1, 1, 1, 0],
    [1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1],
    [1, 0, 1, 0, 1],
    [0, 1, 1, 1, 0]
  ],
  thor: [
    [0, 1, 1, 1, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0]
  ],
  capamerica: [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0]
  ]
};

// 3. Audio Synthesizer (Web Audio API)
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq, duration, type = 'square', sweep = null) {
  if (!gameApp.audioEnabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    if (sweep) {
      osc.frequency.exponentialRampToValueAtTime(sweep.endFreq, ctx.currentTime + duration);
    }
    
    // Retro amplitude envelope (click prevention and quick decay)
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error("Audio error:", e);
  }
}

// Chiptune compositions for actions
function playMenuSound() {
  playTone(880, 0.05, 'square');
}

function playSelectSound() {
  playTone(587.33, 0.08, 'square');
  setTimeout(() => playTone(880, 0.12, 'square'), 80);
}

function playBackSound() {
  playTone(440, 0.12, 'square');
}

function playEatSound(theme) {
  switch (theme) {
    case 'spiderman':
      // Web swinging zip: fast rising frequency sweep
      playTone(400, 0.15, 'triangle', { endFreq: 1200 });
      break;
    case 'ironman':
      // Energy repulsor charge: sweep up sawtooth
      playTone(180, 0.25, 'sawtooth', { endFreq: 750 });
      break;
    case 'thor':
      // Crashing thunder rumble: rapid frequency decay
      playTone(300, 0.35, 'sawtooth', { endFreq: 50 });
      break;
    case 'capamerica':
      // Shield ricochet: triangle wave sweep
      playTone(600, 0.2, 'triangle', { endFreq: 300 });
      break;
    default:
      // Classic vintage eat sound (two-tone chirp)
      playTone(660, 0.06, 'square');
      setTimeout(() => playTone(880, 0.08, 'square'), 60);
      break;
  }
}

function playCrashSound() {
  // Low crash tone
  playTone(120, 0.5, 'sawtooth', { endFreq: 30 });
}

// 4. Main Game Application State
const gameApp = {
  // DOM references
  canvas: null,
  ctx: null,
  
  // Game loops & speed
  gameInterval: null,
  gameSpeed: 150, // ms per tick
  
  // Core game states
  currentTheme: 'classic',
  gameState: 'MENU', // MENU, SELECT_HERO, PLAYING, PAUSED, GAME_OVER, HELP, HIGH_SCORES
  score: 0,
  audioEnabled: true,
  
  // Snake and play area (Grid size 42x20 inside 84x48 canvas)
  gridWidth: 42,
  gridHeight: 20,
  snake: [],
  direction: { x: 1, y: 0 },
  nextDirection: { x: 1, y: 0 },
  food: { x: 0, y: 0 },
  growthPending: 0,
  
  // Menu configuration
  menuOptions: ['PLAY', 'SELECT HERO', 'HIGH SCORES', 'HELP'],
  selectedMenuOption: 0,
  
  // High scores storage structure
  highScores: {
    classic: [0],
    spiderman: [0],
    ironman: [0],
    thor: [0],
    capamerica: [0]
  },
  
  // Active leaderboard tab
  activeLeaderboardTab: 'classic',
  
  init() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Load high scores from localStorage
    const savedScores = localStorage.getItem('nokia_marvel_scores');
    if (savedScores) {
      try {
        this.highScores = JSON.parse(savedScores);
      } catch (e) {
        console.error("Failed to parse scores:", e);
      }
    }
    
    this.setupEventListeners();
    this.switchTheme('classic');
    this.showScreen();
    this.updateLeaderboardDOM();
  },
  
  setupEventListeners() {
    // 1. Cover/Theme Selection Buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const themeId = e.currentTarget.id.replace('theme-', '');
        this.switchTheme(themeId);
        playSelectSound();
      });
    });
    
    // 2. Leaderboard Tab Buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const themeId = e.currentTarget.id.replace('tab-', '');
        this.switchLeaderboardTab(themeId);
        playMenuSound();
      });
    });
    
    // 3. Score Erase Button
    document.getElementById('btn-reset-scores').addEventListener('click', () => {
      if (confirm("Are you sure you want to delete all high scores?")) {
        this.highScores = {
          classic: [0],
          spiderman: [0],
          ironman: [0],
          thor: [0],
          capamerica: [0]
        };
        localStorage.setItem('nokia_marvel_scores', JSON.stringify(this.highScores));
        this.updateLeaderboardDOM();
        playBackSound();
      }
    });
    
    // 4. Audio Toggle Button
    const audioBtn = document.getElementById('btn-audio-toggle');
    audioBtn.addEventListener('click', () => {
      this.audioEnabled = !this.audioEnabled;
      if (this.audioEnabled) {
        audioBtn.classList.remove('sound-off');
        audioBtn.classList.add('sound-on');
        audioBtn.innerHTML = "🔊 AUDIO: ON";
        getAudioContext(); // prime audio context
        playMenuSound();
      } else {
        audioBtn.classList.remove('sound-on');
        audioBtn.classList.add('sound-off');
        audioBtn.innerHTML = "🔇 AUDIO: OFF";
      }
    });
    
    // 5. Physical Phone Button Click Mapping
    document.getElementById('btn-action-menu').addEventListener('click', () => this.handleActionMenu());
    document.getElementById('btn-action-back').addEventListener('click', () => this.handleActionBack());
    
    // Up/Down Rocker Button (scrolls menus)
    document.getElementById('btn-action-scroll').addEventListener('click', (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      if (clickY < rect.height / 2) {
        this.handleScrollUp();
      } else {
        this.handleScrollDown();
      }
    });
    
    // Directions and select key map
    document.getElementById('btn-key-2').addEventListener('click', () => {
      this.changeDirection({ x: 0, y: -1 });
      if (this.gameState !== 'PLAYING') this.handleScrollUp();
    });
    document.getElementById('btn-key-8').addEventListener('click', () => {
      this.changeDirection({ x: 0, y: 1 });
      if (this.gameState !== 'PLAYING') this.handleScrollDown();
    });
    document.getElementById('btn-key-4').addEventListener('click', () => this.changeDirection({ x: -1, y: 0 }));
    document.getElementById('btn-key-6').addEventListener('click', () => this.changeDirection({ x: 1, y: 0 }));
    document.getElementById('btn-key-5').addEventListener('click', () => this.handleActionSelect());
    
    // Optional navigation on other digits
    document.getElementById('btn-key-0').addEventListener('click', () => this.handleActionBack());
    
    // 6. Global Keyboard Handlers
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key)) {
        e.preventDefault();
      }
      
      if (key === 'arrowup' || key === 'w') {
        this.changeDirection({ x: 0, y: -1 });
        if (this.gameState !== 'PLAYING') this.handleScrollUp();
      } else if (key === 'arrowdown' || key === 's') {
        this.changeDirection({ x: 0, y: 1 });
        if (this.gameState !== 'PLAYING') this.handleScrollDown();
      } else if (key === 'arrowleft' || key === 'a') {
        this.changeDirection({ x: -1, y: 0 });
      } else if (key === 'arrowright' || key === 'd') {
        this.changeDirection({ x: 1, y: 0 });
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (this.gameState === 'PLAYING') {
          this.pauseGame();
        } else {
          this.handleActionSelect();
        }
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        this.handleActionBack();
      } else if (key === 'm') {
        audioBtn.click();
      }
    });
  },
  
  switchTheme(themeId) {
    if (!THEME_CONFIGS[themeId]) return;
    this.currentTheme = themeId;
    
    // Update body classes for Xpress-on CSS skinning
    document.body.className = THEME_CONFIGS[themeId].skinClass;
    
    // Update active state of selector buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.id === `theme-${themeId}`);
    });
    
    // Update side instructions panel details
    const config = THEME_CONFIGS[themeId];
    document.getElementById('hero-name').innerText = config.name;
    document.getElementById('hero-desc').innerText = config.desc;
    document.getElementById('hero-pixel-theme').innerText = config.pixelTheme;
    
    // Auto-sync leaderboard view with this hero selection
    this.switchLeaderboardTab(themeId);
    
    // Redraw screen
    this.showScreen();
  },
  
  switchLeaderboardTab(themeId) {
    if (!THEME_CONFIGS[themeId]) return;
    this.activeLeaderboardTab = themeId;
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.id === `tab-${themeId}`);
    });
    
    this.updateLeaderboardDOM();
  },
  
  updateLeaderboardDOM() {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';
    
    const scores = this.highScores[this.activeLeaderboardTab] || [0];
    let validScores = scores.filter(s => s > 0);
    if (validScores.length === 0) {
      list.innerHTML = `<li class="empty-score">No records found. Play to establish data!</li>`;
      return;
    }
    
    validScores.sort((a, b) => b - a);
    const topScores = validScores.slice(0, 5);
    
    topScores.forEach((score, index) => {
      const li = document.createElement('li');
      li.innerHTML = `RANK 0${index + 1} <span class="score-val">${score} pts</span>`;
      list.appendChild(li);
    });
  },
  
  saveHighScore() {
    const scores = this.highScores[this.currentTheme] || [];
    if (!scores.includes(this.score) && this.score > 0) {
      scores.push(this.score);
    }
    scores.sort((a, b) => b - a);
    this.highScores[this.currentTheme] = scores.slice(0, 10);
    
    localStorage.setItem('nokia_marvel_scores', JSON.stringify(this.highScores));
    this.updateLeaderboardDOM();
  },
  
  handleActionMenu() {
    if (this.gameState === 'MENU') {
      this.handleActionSelect();
    } else if (this.gameState === 'PLAYING') {
      this.pauseGame();
    } else if (this.gameState === 'PAUSED') {
      this.resumeGame();
    } else if (this.gameState === 'GAME_OVER' || this.gameState === 'SELECT_HERO' || this.gameState === 'HELP' || this.gameState === 'HIGH_SCORES') {
      this.gameState = 'MENU';
      this.selectedMenuOption = 0;
      playBackSound();
      this.showScreen();
    }
  },
  
  handleActionBack() {
    if (this.gameState === 'MENU') {
      playBackSound();
    } else if (this.gameState === 'PLAYING') {
      this.pauseGame();
    } else if (this.gameState === 'PAUSED') {
      this.stopGameLoop();
      this.saveHighScore();
      this.gameState = 'MENU';
      this.selectedMenuOption = 0;
      playBackSound();
      this.showScreen();
    } else if (this.gameState === 'GAME_OVER') {
      this.gameState = 'MENU';
      this.selectedMenuOption = 0;
      playBackSound();
      this.showScreen();
    } else if (this.gameState === 'SELECT_HERO' || this.gameState === 'HELP' || this.gameState === 'HIGH_SCORES') {
      this.gameState = 'MENU';
      this.selectedMenuOption = 0;
      playBackSound();
      this.showScreen();
    }
  },
  
  handleActionSelect() {
    playSelectSound();
    if (this.gameState === 'MENU') {
      const option = this.menuOptions[this.selectedMenuOption];
      if (option === 'PLAY') {
        this.startGame();
      } else if (option === 'SELECT HERO') {
        this.gameState = 'SELECT_HERO';
        const keys = Object.keys(THEME_CONFIGS);
        this.selectedMenuOption = keys.indexOf(this.currentTheme);
        this.showScreen();
      } else if (option === 'HIGH SCORES') {
        this.gameState = 'HIGH_SCORES';
        this.showScreen();
      } else if (option === 'HELP') {
        this.gameState = 'HELP';
        this.showScreen();
      }
    } else if (this.gameState === 'SELECT_HERO') {
      const keys = Object.keys(THEME_CONFIGS);
      const selectedTheme = keys[this.selectedMenuOption];
      this.switchTheme(selectedTheme);
      this.gameState = 'MENU';
      this.selectedMenuOption = 0;
      this.showScreen();
    } else if (this.gameState === 'GAME_OVER') {
      this.startGame();
    } else if (this.gameState === 'PAUSED') {
      this.resumeGame();
    } else if (this.gameState === 'HELP' || this.gameState === 'HIGH_SCORES') {
      this.gameState = 'MENU';
      this.selectedMenuOption = 0;
      this.showScreen();
    }
  },
  
  handleScrollUp() {
    playMenuSound();
    if (this.gameState === 'MENU') {
      this.selectedMenuOption = (this.selectedMenuOption - 1 + this.menuOptions.length) % this.menuOptions.length;
      this.showScreen();
    } else if (this.gameState === 'SELECT_HERO') {
      const keys = Object.keys(THEME_CONFIGS);
      this.selectedMenuOption = (this.selectedMenuOption - 1 + keys.length) % keys.length;
      this.showScreen();
    }
  },
  
  handleScrollDown() {
    playMenuSound();
    if (this.gameState === 'MENU') {
      this.selectedMenuOption = (this.selectedMenuOption + 1) % this.menuOptions.length;
      this.showScreen();
    } else if (this.gameState === 'SELECT_HERO') {
      const keys = Object.keys(THEME_CONFIGS);
      this.selectedMenuOption = (this.selectedMenuOption + 1) % keys.length;
      this.showScreen();
    }
  },
  
  changeDirection(newDir) {
    if (this.gameState !== 'PLAYING') return;
    const currentDir = this.direction;
    if (newDir.x !== 0 && currentDir.x === 0) {
      this.nextDirection = newDir;
    } else if (newDir.y !== 0 && currentDir.y === 0) {
      this.nextDirection = newDir;
    }
  },
  
  startGame() {
    this.gameState = 'PLAYING';
    this.score = 0;
    this.growthPending = 0;
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    
    const startY = Math.floor(this.gridHeight / 2);
    const startX = 6;
    this.snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
      { x: startX - 3, y: startY }
    ];
    
    this.spawnFood();
    this.startGameLoop();
  },
  
  startGameLoop() {
    this.stopGameLoop();
    this.gameInterval = setInterval(() => this.gameTick(), this.gameSpeed);
    this.showScreen();
  },
  
  stopGameLoop() {
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
  },
  
  pauseGame() {
    if (this.gameState !== 'PLAYING') return;
    this.gameState = 'PAUSED';
    this.stopGameLoop();
    playBackSound();
    this.showScreen();
  },
  
  resumeGame() {
    if (this.gameState !== 'PAUSED') return;
    this.gameState = 'PLAYING';
    playSelectSound();
    this.startGameLoop();
  },
  
  spawnFood() {
    let valid = false;
    let attempts = 0;
    
    while (!valid && attempts < 200) {
      attempts++;
      const fx = Math.floor(Math.random() * (this.gridWidth - 2)) + 1;
      const fy = Math.floor(Math.random() * (this.gridHeight - 2)) + 1;
      
      const onSnake = this.snake.some(segment => segment.x === fx && segment.y === fy);
      if (!onSnake) {
        this.food = { x: fx, y: fy };
        valid = true;
      }
    }
  },
  
  gameTick() {
    if (this.gameState !== 'PLAYING') return;
    
    this.direction = this.nextDirection;
    const head = this.snake[0];
    let newX = head.x + this.direction.x;
    let newY = head.y + this.direction.y;
    
    if (newX < 0) {
      newX = this.gridWidth - 1;
    } else if (newX >= this.gridWidth) {
      newX = 0;
    }
    
    if (newY < 0) {
      newY = this.gridHeight - 1;
    } else if (newY >= this.gridHeight) {
      newY = 0;
    }
    
    const newHead = { x: newX, y: newY };
    
    const selfHit = this.snake.some((segment, index) => {
      if (index === this.snake.length - 1 && this.growthPending === 0) return false;
      return segment.x === newHead.x && segment.y === newHead.y;
    });
    
    if (selfHit) {
      this.handleGameOver();
      return;
    }
    
    this.snake.unshift(newHead);
    
    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      playEatSound(this.currentTheme);
      this.score += 10;
      this.growthPending += 3;
      this.spawnFood();
    } else {
      if (this.growthPending > 0) {
        this.growthPending--;
      } else {
        this.snake.pop();
      }
    }
    
    this.showScreen();
  },
  
  handleGameOver() {
    this.stopGameLoop();
    this.gameState = 'GAME_OVER';
    playCrashSound();
    this.saveHighScore();
    this.showScreen();
  },
  
  showScreen() {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    
    const computedStyle = getComputedStyle(document.documentElement);
    const pixelColor = computedStyle.getPropertyValue('--lcd-pixel').trim() || '#2b392b';
    const bgColor = computedStyle.getPropertyValue('--lcd-bg').trim() || '#b9c7a2';
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cw, ch);
    
    ctx.fillStyle = pixelColor;
    ctx.strokeStyle = pixelColor;
    ctx.lineWidth = 1;
    
    if (this.gameState === 'MENU') {
      this.drawMenuScreen(ctx, pixelColor);
    } else if (this.gameState === 'SELECT_HERO') {
      this.drawHeroSelectScreen(ctx, pixelColor);
    } else if (this.gameState === 'PLAYING' || this.gameState === 'PAUSED') {
      this.drawGameplayScreen(ctx, pixelColor);
    } else if (this.gameState === 'GAME_OVER') {
      this.drawGameOverScreen(ctx, pixelColor);
    } else if (this.gameState === 'HELP') {
      this.drawHelpScreen(ctx, pixelColor);
    } else if (this.gameState === 'HIGH_SCORES') {
      this.drawHighScoresScreen(ctx, pixelColor);
    }
  },
  
  drawMenuScreen(ctx, color) {
    ctx.font = "6px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText("--- MENU ---", 42, 8);
    
    this.menuOptions.forEach((option, idx) => {
      const y = 18 + (idx * 8);
      ctx.textAlign = "left";
      
      if (idx === this.selectedMenuOption) {
        ctx.fillStyle = color;
        ctx.fillRect(4, y - 6, 76, 8);
        
        const computedStyle = getComputedStyle(document.documentElement);
        const bgColor = computedStyle.getPropertyValue('--lcd-bg').trim() || '#b9c7a2';
        ctx.fillStyle = bgColor;
        ctx.fillText(`>${option}`, 6, y);
        ctx.fillStyle = color;
      } else {
        ctx.fillText(` ${option}`, 6, y);
      }
    });
  },
  
  drawHeroSelectScreen(ctx, color) {
    ctx.font = "6px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText("SELECT HERO", 42, 8);
    
    const keys = Object.keys(THEME_CONFIGS);
    keys.forEach((themeKey, idx) => {
      const y = 17 + (idx * 6);
      const displayName = THEME_CONFIGS[themeKey].displayName;
      ctx.textAlign = "left";
      
      if (idx === this.selectedMenuOption) {
        ctx.fillStyle = color;
        ctx.fillRect(4, y - 5, 76, 6);
        const computedStyle = getComputedStyle(document.documentElement);
        const bgColor = computedStyle.getPropertyValue('--lcd-bg').trim() || '#b9c7a2';
        ctx.fillStyle = bgColor;
        ctx.fillText(`>${displayName}`, 6, y);
        ctx.fillStyle = color;
      } else {
        ctx.fillText(` ${displayName}`, 6, y);
      }
    });
  },
  
  drawGameplayScreen(ctx, color) {
    ctx.beginPath();
    ctx.moveTo(0, 7.5);
    ctx.lineTo(84, 7.5);
    ctx.stroke();
    
    ctx.font = "5px 'Press Start 2P', monospace";
    ctx.textAlign = "left";
    const heroName = THEME_CONFIGS[this.currentTheme].displayName;
    ctx.fillText(heroName, 2, 5);
    
    ctx.textAlign = "right";
    const paddedScore = String(this.score).padStart(4, '0');
    ctx.fillText(paddedScore, 82, 5);
    
    ctx.fillStyle = color;
    this.snake.forEach((segment, index) => {
      const px = segment.x * 2;
      const py = 8 + segment.y * 2;
      
      if (this.currentTheme === 'classic') {
        ctx.fillRect(px, py, 2, 2);
      } else if (this.currentTheme === 'spiderman') {
        if (index === 0) {
          ctx.fillRect(px, py, 2, 2);
        } else {
          ctx.fillRect(px, py + 1, 2, 1);
          ctx.fillRect(px + 1, py, 1, 2);
        }
      } else if (this.currentTheme === 'ironman') {
        if (index === 0 || index % 2 === 0) {
          ctx.fillRect(px, py, 2, 2);
        } else {
          ctx.strokeRect(px + 0.5, py + 0.5, 1, 1);
        }
      } else if (this.currentTheme === 'thor') {
        if (index === 0) {
          ctx.fillRect(px, py, 2, 2);
        } else {
          const shift = index % 2 === 0 ? 0 : 1;
          ctx.fillRect(px + shift, py, 1, 1);
          ctx.fillRect(px + 1 - shift, py + 1, 1, 1);
        }
      } else if (this.currentTheme === 'capamerica') {
        if (index === 0) {
          ctx.fillRect(px, py, 2, 2);
        } else if (index % 3 === 0) {
          ctx.fillRect(px, py, 1, 2);
        } else if (index % 3 === 1) {
          ctx.fillRect(px + 1, py, 1, 2);
        } else {
          ctx.fillRect(px, py, 2, 1);
        }
      }
    });
    
    const spriteMatrix = SPRITES[this.currentTheme] || SPRITES.classic;
    ctx.fillStyle = color;
    
    const fx = this.food.x * 2;
    const fy = 8 + this.food.y * 2;
    const startX = fx - 1;
    const startY = fy - 1;
    
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (spriteMatrix[r][c]) {
          ctx.fillRect(startX + c, startY + r, 1, 1);
        }
      }
    }
    
    if (this.gameState === 'PAUSED') {
      ctx.fillStyle = color;
      ctx.fillRect(18, 16, 48, 14);
      
      const computedStyle = getComputedStyle(document.documentElement);
      const bgColor = computedStyle.getPropertyValue('--lcd-bg').trim() || '#b9c7a2';
      ctx.fillStyle = bgColor;
      ctx.font = "6px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      ctx.fillText("PAUSED", 42, 25);
    }
  },
  
  drawGameOverScreen(ctx, color) {
    ctx.font = "6px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", 42, 15);
    
    ctx.font = "5px 'Press Start 2P', monospace";
    ctx.fillText(`SCORE: ${this.score}`, 42, 25);
    
    ctx.fillStyle = color;
    ctx.fillRect(12, 32, 60, 10);
    
    const computedStyle = getComputedStyle(document.documentElement);
    const bgColor = computedStyle.getPropertyValue('--lcd-bg').trim() || '#b9c7a2';
    ctx.fillStyle = bgColor;
    ctx.fillText("RETRY (5)", 42, 39);
  },
  
  drawHelpScreen(ctx, color) {
    ctx.font = "6px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText("HELP GUIDE", 42, 8);
    
    ctx.font = "4px 'Press Start 2P', monospace";
    ctx.textAlign = "left";
    ctx.fillText("CONTROLS:", 4, 16);
    ctx.fillText("* USE KEYPAD / WASD", 4, 23);
    ctx.fillText("* BTN 5: SELECT/OK", 4, 30);
    ctx.fillText("* BTN C: GO BACK/ESC", 4, 37);
    
    ctx.textAlign = "center";
    ctx.fillText("[PRESS C TO EXIT]", 42, 45);
  },
  
  drawHighScoresScreen(ctx, color) {
    ctx.font = "6px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText("HIGH SCORES", 42, 8);
    
    ctx.font = "4px 'Press Start 2P', monospace";
    ctx.textAlign = "left";
    
    const keys = Object.keys(THEME_CONFIGS);
    keys.forEach((themeKey, idx) => {
      const displayName = THEME_CONFIGS[themeKey].displayName;
      const scores = this.highScores[themeKey] || [0];
      const maxScore = Math.max(...scores, 0);
      
      const y = 17 + (idx * 6);
      ctx.fillText(`${displayName}:`, 6, y);
      ctx.textAlign = "right";
      ctx.fillText(`${maxScore}`, 78, y);
      ctx.textAlign = "left";
    });
  }
};

window.addEventListener('DOMContentLoaded', () => {
  gameApp.init();
  window.gameApp = gameApp;
});
