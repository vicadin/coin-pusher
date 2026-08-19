export type GamePhase = 'LOADING' | 'READY' | 'DROPPING' | 'REWARD' | 'CTA';

type PhaseHandler = (previous: GamePhase) => void;

export class StateMachine {
  private phase: GamePhase = 'LOADING';
  private readonly handlers = new Map<GamePhase, PhaseHandler>();

  get current(): GamePhase {
    return this.phase;
  }

  onEnter(phase: GamePhase, handler: PhaseHandler): void {
    this.handlers.set(phase, handler);
  }

  transition(next: GamePhase): void {
    if (this.phase === next) {
      return;
    }
    const previous = this.phase;
    this.phase = next;
    this.handlers.get(next)?.(previous);
  }

  is(...phases: GamePhase[]): boolean {
    return phases.includes(this.phase);
  }
}
