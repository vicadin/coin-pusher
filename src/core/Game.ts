import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';

export const LOGICAL_WIDTH = 375;
export const LOGICAL_HEIGHT = 667;

export class Game {
  private app: Application | null = null;
  private worldContainer: Container | null = null;
  private destroyed = false;

  async init(container: HTMLElement): Promise<void> {
    this.app = new Application();
    await this.app.init({
      background: 0x080e2b,
      resizeTo: container,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio, 2),
      autoDensity: true,
    });

    container.appendChild(this.app.canvas);

    this.worldContainer = new Container();
    this.app.stage.addChild(this.worldContainer);

    this.setupDebugScene();

    this.setupResize(container);

    this.hideLoadingScreen();

    console.info('[Game] Step 2 initialized successfully: Canvas mounted & Responsive scaling active.');
  }

  private setupDebugScene(): void {
    if (!this.worldContainer) return;

    const debugFrame = new Graphics();
    debugFrame
      .roundRect(16, 16, LOGICAL_WIDTH - 32, LOGICAL_HEIGHT - 32, 16)
      .fill({ color: 0x131c54, alpha: 0.8 });
    debugFrame
      .roundRect(16, 16, LOGICAL_WIDTH - 32, LOGICAL_HEIGHT - 32, 16)
      .stroke({ color: 0x3949ab, width: 3 });
    this.worldContainer.addChild(debugFrame);

    const debugText = new Text({
      text: 'COIN PUSHER\n[STEP 2: CANVAS READY]',
      style: new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: 18,
        fontWeight: 'bold',
        fill: 0xffeb3b,
        align: 'center',
        lineHeight: 26,
      }),
    });
    debugText.anchor.set(0.5);
    debugText.position.set(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
    this.worldContainer.addChild(debugText);
  }

  private setupResize(container: HTMLElement): void {
    window.addEventListener('resize', this.onResize);
    this.handleResize(container);
  }

  private onResize = (): void => {
    if (this.app?.canvas?.parentElement) {
      this.handleResize(this.app.canvas.parentElement);
    }
  };

  private handleResize(container: HTMLElement): void {
    if (!this.app || !this.worldContainer) return;

    const containerWidth = container.clientWidth || window.innerWidth;
    const containerHeight = container.clientHeight || window.innerHeight;

    const scale = Math.min(
      containerWidth / LOGICAL_WIDTH,
      containerHeight / LOGICAL_HEIGHT,
    );

    this.worldContainer.scale.set(scale);

    this.worldContainer.position.set(
      (containerWidth - LOGICAL_WIDTH * scale) / 2,
      (containerHeight - LOGICAL_HEIGHT * scale) / 2,
    );
  }

  private hideLoadingScreen(): void {
    const loadingEl = document.getElementById('loading-screen');
    loadingEl?.classList.add('hidden');
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    window.removeEventListener('resize', this.onResize);
    this.app?.destroy(true, { children: true });
    this.app = null;
  }
}