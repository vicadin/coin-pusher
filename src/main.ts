import { Game } from '@/core/Game';

async function bootstrap(): Promise<void> {
  const container = document.getElementById('game-container');
  if (!container) {
    throw new Error('#game-container not found');
  }

}

void bootstrap();
