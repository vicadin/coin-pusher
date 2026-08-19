import { Game } from '@/core/Game';
import { createAdBridge } from '@/bridge/AdBridge';

async function bootstrap(): Promise<void> {
  const container = document.getElementById('game-container');
  if (!container) {
    throw new Error('#game-container not found');
  }

  const adBridge = createAdBridge();
  const game = new Game(adBridge);

  try {
    await game.init(container);
  } catch (error) {
    console.error('Failed to initialize game:', error);
    const loading = document.getElementById('loading-screen');
    if (loading) {
      const text = loading.querySelector('.loading-text');
      if (text) {
        text.textContent = 'Failed to load. Please refresh.';
      }
    }
  }

  window.addEventListener('beforeunload', () => {
    game.destroy();
  });
}

void bootstrap();
