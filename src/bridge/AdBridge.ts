export interface AdBridge {
  init(): Promise<void>;
  openStore(): void;
}

export class MockAdBridge implements AdBridge {
  async init(): Promise<void> {
    // mock network
  }

  openStore(): void {
    window.open('https://example.com/', '_blank');
  }
}

export function createAdBridge(): AdBridge {
  return new MockAdBridge();
}
