import { Game } from './core/Game';

const container = document.getElementById('game-container');
if (container) {
  const game = new Game();
  void game.init(container);
}