export const GameEvents = {
  DROP_STARTED: 'DROP_STARTED',
  COIN_COLLECTED: 'COIN_COLLECTED',
  REWARD_SHOWN: 'REWARD_SHOWN',
  CTA_SHOWN: 'CTA_SHOWN',
  STATE_CHANGED: 'STATE_CHANGED',
} as const;

export type GameEventName = (typeof GameEvents)[keyof typeof GameEvents];

type EventHandler<T = unknown> = (payload: T) => void;

export class EventBus {
  private readonly handlers = new Map<string, Set<EventHandler>>();

  on<T>(event: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)?.add(handler as EventHandler);
  }

  off<T>(event: string, handler: EventHandler<T>): void {
    this.handlers.get(event)?.delete(handler as EventHandler);
  }

  emit<T>(event: string, payload?: T): void {
    const eventHandlers = this.handlers.get(event);
    if (!eventHandlers) {
      return;
    }
    for (const handler of eventHandlers) {
      handler(payload);
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}
