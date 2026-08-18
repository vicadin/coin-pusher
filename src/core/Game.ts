import { Application, Container, Graphics } from 'pixi.js';
import { GAME_CONFIG } from '../config/gameConfig';

export type FieldBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
};

export class Game {
  private app: Application | null = null;
  private worldContainer: Container | null = null;

  private fieldContainer: Container | null = null;
  private coinLayer: Container | null = null;
  private uiLayer: Container | null = null;

  private fieldBounds: FieldBounds | null = null;
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

    this.setupLayers();
    this.setupField();
    this.setupResize(container);
    this.hideLoadingScreen();

  }

  private setupLayers(): void {
    if (!this.app) return;

    this.worldContainer = new Container();
    this.fieldContainer = new Container();
    this.coinLayer = new Container();
    this.uiLayer = new Container();

    this.app.stage.addChild(this.worldContainer);

    this.worldContainer.addChild(
      this.fieldContainer,
      this.coinLayer,
      this.uiLayer,
    );
  }

  private setupField(): void {
    if (!this.fieldContainer) return;

    const { logicalWidth, logicalHeight, fieldPadding, fieldTop, fieldBottom } = GAME_CONFIG;
    const fieldWidth = logicalWidth - fieldPadding * 2;
    const fieldHeight = fieldBottom - fieldTop;

    const cabinetBg = new Graphics();
    cabinetBg
      .roundRect(6, 6, logicalWidth - 12, logicalHeight - 12, 22)
      .fill({ color: 0x0c1333 });
    cabinetBg
      .roundRect(6, 6, logicalWidth - 12, logicalHeight - 12, 22)
      .stroke({ color: 0x1a237e, width: 3 });
    this.fieldContainer.addChild(cabinetBg);

    const playfieldBox = new Graphics();
    playfieldBox
      .roundRect(fieldPadding, fieldTop, fieldWidth, fieldHeight, 16)
      .fill({ color: 0x131c54 });
    playfieldBox
      .roundRect(fieldPadding, fieldTop, fieldWidth, fieldHeight, 16)
      .stroke({ color: 0x3949ab, width: 3.5 });
    this.fieldContainer.addChild(playfieldBox);

    const gridGfx = new Graphics();
    for (let y = fieldTop + 45; y < fieldBottom - 20; y += 45) {
      gridGfx
        .rect(fieldPadding + 10, y, fieldWidth - 20, 1)
        .fill({ color: 0x1e2a78, alpha: 0.45 });
    }
    this.fieldContainer.addChild(gridGfx);

    const bottomRail = new Graphics();
    bottomRail
      .roundRect(fieldPadding + 8, fieldBottom - 58, fieldWidth - 16, 48, 8)
      .fill({ color: 0x090f2b, alpha: 0.85 });
    bottomRail
      .roundRect(fieldPadding + 8, fieldBottom - 58, fieldWidth - 16, 48, 8)
      .stroke({ color: 0x283593, width: 2 });
    this.fieldContainer.addChild(bottomRail);

    this.fieldBounds = {
      left: fieldPadding + 4,
      right: fieldPadding + fieldWidth - 4,
      top: fieldTop + 4,
      bottom: fieldBottom - 4,
      width: fieldWidth - 8,
      height: fieldHeight - 8,
    };
  }

  private setupResize(container: HTMLElement): void {
    this.onResize = () => this.handleResize(container);
    window.addEventListener('resize', this.onResize);
    this.handleResize(container);
  }

  private onResize = (): void => {
    // todo
  };

  private handleResize(container: HTMLElement): void {
    if (!this.app || !this.worldContainer) return;

    const containerWidth = container.clientWidth || window.innerWidth;
    const containerHeight = container.clientHeight || window.innerHeight;

    const scale = Math.min(
      containerWidth / GAME_CONFIG.logicalWidth,
      containerHeight / GAME_CONFIG.logicalHeight,
    );

    this.worldContainer.scale.set(scale);
    this.worldContainer.position.set(
      (containerWidth - GAME_CONFIG.logicalWidth * scale) / 2,
      (containerHeight - GAME_CONFIG.logicalHeight * scale) / 2,
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