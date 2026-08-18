export class ObjectPool<T> {
  private readonly pool: T[] = [];
  private readonly factory: () => T;
  private readonly reset: (item: T) => void;

  constructor(factory: () => T, reset: (item: T) => void, initialSize = 0) {
    this.factory = factory;
    this.reset = reset;
    for (let index = 0; index < initialSize; index += 1) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    const item = this.pool.pop();
    if (item) {
      return item;
    }
    return this.factory();
  }

  release(item: T): void {
    this.reset(item);
    this.pool.push(item);
  }

  get available(): number {
    return this.pool.length;
  }
}
