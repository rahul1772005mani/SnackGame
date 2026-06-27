const { test, expect } = require('@playwright/test');

test.describe('Nokia 3310 Marvel Snake E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the local server
    await page.goto('/');
    // Clear localStorage to ensure clean state
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should switch phone visual skins when clicking Marvel selectors', async ({ page }) => {
    // 1. Check default skin
    await expect(page.locator('body')).toHaveClass(/skin-classic/);
    await expect(page.locator('#hero-name')).toHaveText('CLASSIC SNAKE');

    // 2. Click Spider-Man cover button
    await page.click('#theme-spiderman');
    await expect(page.locator('body')).toHaveClass(/skin-spiderman/);
    await expect(page.locator('#hero-name')).toHaveText('SPIDER-MAN');
    await expect(page.locator('#hero-pixel-theme')).toHaveText('Spidey Red & Blue');

    // 3. Click Iron Man cover button
    await page.click('#theme-ironman');
    await expect(page.locator('body')).toHaveClass(/skin-ironman/);
    await expect(page.locator('#hero-name')).toHaveText('IRON MAN');

    // 4. Click Thor cover button
    await page.click('#theme-thor');
    await expect(page.locator('body')).toHaveClass(/skin-thor/);
    await expect(page.locator('#hero-name')).toHaveText('THOR');

    // 5. Click Captain America cover button
    await page.click('#theme-capamerica');
    await expect(page.locator('body')).toHaveClass(/skin-capamerica/);
    await expect(page.locator('#hero-name')).toHaveText('CAPTAIN AMERICA');
  });

  test('should navigate menu using simulator keypad buttons', async ({ page }) => {
    // Check initial menu selection
    let selectedOptionIdx = await page.evaluate(() => window.gameApp.selectedMenuOption);
    expect(selectedOptionIdx).toBe(0); // "PLAY" is the first option

    // Click direction down (Key 8)
    await page.click('#btn-key-8');
    selectedOptionIdx = await page.evaluate(() => window.gameApp.selectedMenuOption);
    expect(selectedOptionIdx).toBe(1); // "SELECT HERO"

    // Click direction down (Key 8) again
    await page.click('#btn-key-8');
    selectedOptionIdx = await page.evaluate(() => window.gameApp.selectedMenuOption);
    expect(selectedOptionIdx).toBe(2); // "HIGH SCORES"

    // Click direction up (Key 2)
    await page.click('#btn-key-2');
    selectedOptionIdx = await page.evaluate(() => window.gameApp.selectedMenuOption);
    expect(selectedOptionIdx).toBe(1); // Back to "SELECT HERO"
  });

  test('should start the game loop when PLAY is selected', async ({ page }) => {
    // Make sure we are in MENU state initially
    let gameState = await page.evaluate(() => window.gameApp.gameState);
    expect(gameState).toBe('MENU');

    // Press Enter to start (PLAY is index 0)
    await page.keyboard.press('Enter');
    
    // Check if game starts playing
    gameState = await page.evaluate(() => window.gameApp.gameState);
    expect(gameState).toBe('PLAYING');
    
    // Verify snake coordinates exist
    const snakeLength = await page.evaluate(() => window.gameApp.snake.length);
    expect(snakeLength).toBeGreaterThan(0);
  });

  test('should wrap around the screen when hitting borders (looping)', async ({ page }) => {
    // Start game
    await page.keyboard.press('Enter');
    
    // Place snake head right near the top border, facing up
    await page.evaluate(() => {
      window.gameApp.snake = [
        { x: 10, y: 0 },
        { x: 10, y: 1 },
        { x: 10, y: 2 }
      ];
      window.gameApp.direction = { x: 0, y: -1 }; // heading up
      window.gameApp.nextDirection = { x: 0, y: -1 };
      
      // Perform a game tick manually
      window.gameApp.gameTick();
    });

    // Verify snake wrapped around to the bottom edge of the play grid (y = 19)
    const headY = await page.evaluate(() => window.gameApp.snake[0].y);
    expect(headY).toBe(19);

    // Verify the game state remains PLAYING
    const gameState = await page.evaluate(() => window.gameApp.gameState);
    expect(gameState).toBe('PLAYING');
  });

  test('should trigger game over state upon self collision', async ({ page }) => {
    // Start game
    await page.keyboard.press('Enter');
    
    // Position snake segments to form a loop that hits itself
    await page.evaluate(() => {
      // Segment 0: (10, 10) - head
      // Segment 1: (10, 9)
      // Segment 2: (9, 9)
      // Segment 3: (9, 10) - body segment in path
      // Segment 4: (9, 11) - tail
      window.gameApp.snake = [
        { x: 10, y: 10 },
        { x: 10, y: 9 },
        { x: 9, y: 9 },
        { x: 9, y: 10 },
        { x: 9, y: 11 }
      ];
      // Set direction to move left (x: -1, y: 0), heading into (9, 10)
      window.gameApp.direction = { x: -1, y: 0 };
      window.gameApp.nextDirection = { x: -1, y: 0 };
      
      // Perform a tick manually
      window.gameApp.gameTick();
    });

    // Check that state transitions to GAME_OVER
    const finalState = await page.evaluate(() => window.gameApp.gameState);
    expect(finalState).toBe('GAME_OVER');
  });

});
