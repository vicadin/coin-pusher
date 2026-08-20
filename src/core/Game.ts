import {
  Application,
  Container,
  Graphics,
  Text,
  TextStyle,
  Ticker,
  type FederatedPointerEvent,
} from 'pixi.js';
import { GAME_CONFIG } from '@/config/gameConfig';
import { COIN_CONFIG } from '@/config/coinConfig';
import { EventBus, GameEvents } from '@/core/EventBus';
import { StateMachine } from '@/core/StateMachine';
import { createInitialGameState, type GameState } from '@/model/GameState';
import { Coin, createCoinTexture, resetCoinIds } from '@/components/Coin';
import { DropButton } from '@/components/DropButton';
import { RewardPopup } from '@/components/RewardPopup';
import { CtaPopup } from '@/components/CtaPopup';
import { PhysicsSystem, type FieldBounds } from '@/systems/PhysicsSystem';
import { CollisionSystem } from '@/systems/CollisionSystem';
import { RewardSystem } from '@/systems/RewardSystem';
import { ParticleSystem } from '@/systems/ParticleSystem';
import { ObjectPool } from '@/utils/ObjectPool';
import { Tween, TweenManager, easeOutCubic } from '@/utils/easing';
import { randomRange } from '@/utils/random';
import { AudioManager } from '@/utils/AudioManager';
import type { AdBridge } from '@/bridge/AdBridge';

export class Game {
  private readonly adBridge: AdBridge;
  private readonly eventBus = new EventBus();
  private readonly stateMachine = new StateMachine();
  private readonly gameState: GameState = createInitialGameState();
  private readonly tweenManager = new TweenManager();
  private readonly audio = new AudioManager();

  private app: Application | null = null;
  private worldContainer: Container | null = null;
  private fieldContainer: Container | null = null;
  private coinLayer: Container | null = null;
  private fxLayer: Container | null = null;
  private uiLayer: Container | null = null;

  private dropButton: DropButton | null = null;
  private coinCounterText: Text | null = null;
  private scoreCardGraphic: Graphics | null = null;
  private displayedCoins = 120;

  private readonly physics = new PhysicsSystem();
  private readonly collision = new CollisionSystem();
  private rewardSystem: RewardSystem | null = null;
  private particleSystem: ParticleSystem | null = null;
  private rewardPopup: RewardPopup | null = null;
  private ctaPopup: CtaPopup | null = null;

  private coinPool: ObjectPool<Coin> | null = null;
  private activeCoins: Coin[] = [];
  private fieldBounds: FieldBounds | null = null;

  private pusherContainer: Container | null = null;
  private pusherGraphic: Graphics | null = null;
  private pusherText: Text | null = null;

  private settleFrameCount = 0;
  private lastDropTime = 0;
  private shakeTime = 0;
  private screenShakeIntensity: number = GAME_CONFIG.screenShakeIntensity;
  private destroyed = false;

  constructor(adBridge: AdBridge) {
    this.adBridge = adBridge;
  }

  async init(container: HTMLElement): Promise<void> {
    resetCoinIds();

    this.app = new Application();
    await this.app.init({
      background: 0x080e2b,
      resizeTo: container,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio, 2),
      autoDensity: true,
    });

    container.appendChild(this.app.canvas);
    this.app.stage.eventMode = 'static';

    this.setupStateMachine();
    this.setupLayers();
    this.setupField();
    this.setupCoinPool();
    this.setupSystems();
    this.setupUI();
    this.spawnInitialCoins();
    this.setupTicker();
    this.setupResize(container);
    this.setupInputUnlock();

    await this.adBridge.init();
    this.hideLoadingScreen();
    this.stateMachine.transition('READY');
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;

    this.app?.ticker.remove(this.onTick, this);
    window.removeEventListener('resize', this.onWindowResize);
    this.tweenManager.clear();
    this.eventBus.clear();
    this.app?.destroy(true, { children: true });
    this.app = null;
  }

  private setupStateMachine(): void {
    this.stateMachine.onEnter('READY', () => {
      this.gameState.isInputLocked = false;
      const dropIdx = this.gameState.dropCount;

      if (dropIdx >= GAME_CONFIG.maxDropsBeforeCta) {
        this.scheduleCta();
        return;
      }

      this.dropButton?.setEnabled(true);
      this.dropButton?.setStep(dropIdx);
      this.settleFrameCount = 0;
    });

    this.stateMachine.onEnter('DROPPING', () => {
      this.gameState.isInputLocked = true;
      this.dropButton?.setEnabled(false);
      this.settleFrameCount = 0;
    });

    this.stateMachine.onEnter('REWARD', () => {
      this.gameState.isInputLocked = true;
      this.dropButton?.setEnabled(false);
    });

    this.stateMachine.onEnter('CTA', () => {
      this.gameState.isInputLocked = true;
      this.dropButton?.setEnabled(false);
      if (this.dropButton) {
        this.dropButton.visible = false;
      }
      this.audio.play('cta');
      this.ctaPopup?.show(this.gameState.totalWon || 100, () => {
        this.eventBus.emit(GameEvents.CTA_SHOWN);
      });
    });
  }

  private setupLayers(): void {
    if (!this.app) {
      return;
    }

    this.worldContainer = new Container();
    this.fieldContainer = new Container();
    this.coinLayer = new Container();
    this.fxLayer = new Container();
    this.uiLayer = new Container();
    this.uiLayer.eventMode = 'static';

    this.app.stage.addChild(this.worldContainer);
    this.worldContainer.addChild(
      this.fieldContainer,
      this.coinLayer,
      this.fxLayer,
      this.uiLayer,
    );

    this.particleSystem = new ParticleSystem(this.fxLayer, GAME_CONFIG.particlePoolSize);
    this.rewardPopup = new RewardPopup(this.uiLayer);
    this.ctaPopup = new CtaPopup(this.adBridge);
    this.rewardSystem = new RewardSystem(this.eventBus, this.gameState);
  }

  private setupField(): void {
    if (!this.fieldContainer) {
      return;
    }

    const { logicalWidth, logicalHeight, fieldPadding, fieldTop, fieldBottom } = GAME_CONFIG;
    const fieldWidth = logicalWidth - fieldPadding * 2;
    const fieldHeight = fieldBottom - fieldTop;

    const bg = new Graphics();
    bg.roundRect(6, 6, logicalWidth - 12, logicalHeight - 12, 22).fill({ color: 0x0c1333 });
    bg.roundRect(6, 6, logicalWidth - 12, logicalHeight - 12, 22).stroke({ color: 0x1a237e, width: 3 });
    this.fieldContainer.addChild(bg);

    const fieldFrame = new Graphics();
    fieldFrame
      .roundRect(fieldPadding, fieldTop, fieldWidth, fieldHeight, 16)
      .fill({ color: 0x131c54 });
    fieldFrame
      .roundRect(fieldPadding, fieldTop, fieldWidth, fieldHeight, 16)
      .stroke({ color: 0x3949ab, width: 3.5 });
    this.fieldContainer.addChild(fieldFrame);

    const gridGfx = new Graphics();
    for (let y = fieldTop + 40; y < fieldBottom - 20; y += 45) {
      gridGfx.rect(fieldPadding + 10, y, fieldWidth - 20, 1).fill({ color: 0x1e2a78, alpha: 0.45 });
    }
    this.fieldContainer.addChild(gridGfx);

    const railGfx = new Graphics();
    railGfx
      .roundRect(fieldPadding + 6, GAME_CONFIG.pusherY + 4, fieldWidth - 12, GAME_CONFIG.pusherHeight - 4, 10)
      .fill({ color: 0x090f2b, alpha: 0.9 });
    railGfx
      .roundRect(fieldPadding + 6, GAME_CONFIG.pusherY + 4, fieldWidth - 12, GAME_CONFIG.pusherHeight - 4, 10)
      .stroke({ color: 0x283593, width: 2 });
    this.fieldContainer.addChild(railGfx);

    this.pusherContainer = new Container();
    this.pusherGraphic = new Graphics();
    this.pusherContainer.addChild(this.pusherGraphic);

    this.pusherText = new Text({
      text: 'REWARD ZONE',
      style: new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: 10,
        fontWeight: '900',
        fill: 0xffeb3b,
        letterSpacing: 1.2,
        dropShadow: {
          alpha: 0.8,
          angle: Math.PI / 2,
          blur: 2,
          color: 0x000000,
          distance: 1,
        },
      }),
    });
    this.pusherText.anchor.set(0.5);
    this.pusherText.position.set(0, GAME_CONFIG.pusherHeight / 2);
    this.pusherContainer.addChild(this.pusherText);

    this.fieldContainer.addChild(this.pusherContainer);

    const dropInteractiveZone = new Graphics();
    dropInteractiveZone
      .rect(fieldPadding, fieldTop, fieldWidth, 180)
      .fill({ color: 0xffffff, alpha: 0.001 });
    dropInteractiveZone.eventMode = 'static';
    dropInteractiveZone.cursor = 'pointer';
    dropInteractiveZone.on('pointertap', (event: FederatedPointerEvent) => {
      const local = this.worldContainer?.toLocal(event.global);
      if (local) {
        this.onDropRequested(local.x);
      } else {
        this.onDropRequested();
      }
    });
    this.fieldContainer.addChild(dropInteractiveZone);

    this.updateFieldBounds();
    this.drawPusher();
  }

  private updateFieldBounds(): void {
    const { logicalWidth, fieldPadding, fieldTop, fieldBottom } = GAME_CONFIG;
    const fieldWidth = logicalWidth - fieldPadding * 2;

    this.fieldBounds = {
      left: fieldPadding + 4,
      right: fieldPadding + fieldWidth - 4,
      top: fieldTop + 4,
      bottom: fieldBottom - 4,
      pusherX: this.physics.getPusherX(),
      pusherY: GAME_CONFIG.pusherY,
      pusherWidth: GAME_CONFIG.pusherWidth,
      pusherHeight: GAME_CONFIG.pusherHeight,
      pusherVelocityX: this.physics.getPusherVelocityX(),
    };
  }

  private drawPusher(): void {
    if (!this.pusherGraphic || !this.pusherContainer || !this.fieldBounds) {
      return;
    }

    const currentX = this.physics.getPusherX();
    const width = GAME_CONFIG.pusherWidth;
    const height = GAME_CONFIG.pusherHeight;

    this.pusherContainer.position.set(currentX, GAME_CONFIG.pusherY);

    this.pusherGraphic.clear();

    this.pusherGraphic
      .roundRect(-width / 2 - 4, 0, width + 8, height + 4, 12)
      .fill({ color: 0xffb300, alpha: 0.25 });

    this.pusherGraphic
      .roundRect(-width / 2, 2, width, height - 4, 10)
      .fill({ color: 0x3f51b5 });

    this.pusherGraphic
      .roundRect(-width / 2, 2, width, height - 4, 10)
      .stroke({ color: 0xffc107, width: 2.5 });

    this.pusherGraphic
      .roundRect(-width / 2 + 4, 4, width - 8, height * 0.35, 6)
      .fill({ color: 0x9fa8da, alpha: 0.5 });

    this.pusherGraphic
      .poly([
        -width / 2 + 12, height / 2,
        -width / 2 + 18, height / 2 - 6,
        -width / 2 + 18, height / 2 + 6,
      ])
      .fill({ color: 0xffeb3b });

    this.pusherGraphic
      .poly([
        width / 2 - 12, height / 2,
        width / 2 - 18, height / 2 - 6,
        width / 2 - 18, height / 2 + 6,
      ])
      .fill({ color: 0xffeb3b });
  }

  private setupCoinPool(): void {
    const texture = createCoinTexture();

    this.coinPool = new ObjectPool(
      () => new Coin(texture, COIN_CONFIG.radius),
      (coin) => coin.deactivate(),
      GAME_CONFIG.coinPoolSize,
    );
  }

  private setupSystems(): void {
    this.eventBus.on<{ amount: number; coin: Coin; isJackpot?: boolean }>(
      GameEvents.COIN_COLLECTED,
      (payload) => {
        if (!payload) {
          return;
        }
        this.onCoinCollected(payload.amount, payload.coin, payload.isJackpot);
      },
    );
  }

  private setupUI(): void {
    if (!this.uiLayer) {
      return;
    }

    this.scoreCardGraphic = new Graphics();
    this.drawScoreCard();
    this.uiLayer.addChild(this.scoreCardGraphic);

    this.coinCounterText = new Text({
      text: `🪙 ${this.gameState.totalCoins} COINS`,
      style: new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: 20,
        fontWeight: '900',
        fill: 0xffeb3b,
        letterSpacing: 1.5,
        stroke: { color: 0xe65100, width: 3 },
        dropShadow: {
          alpha: 0.6,
          angle: Math.PI / 2,
          blur: 3,
          color: 0x000000,
          distance: 1.5,
        },
      }),
    });
    this.coinCounterText.anchor.set(0.5);
    this.coinCounterText.position.set(GAME_CONFIG.logicalWidth / 2, 44);
    this.uiLayer.addChild(this.coinCounterText);

    this.dropButton = new DropButton(() => this.onDropRequested());
    this.dropButton.position.set(GAME_CONFIG.logicalWidth / 2, 612);
    this.uiLayer.addChild(this.dropButton);
  }

  private drawScoreCard(): void {
    if (!this.scoreCardGraphic) {
      return;
    }
    const width = 190;
    const height = 40;
    const x = GAME_CONFIG.logicalWidth / 2;
    const y = 44;

    this.scoreCardGraphic.clear();
    this.scoreCardGraphic
      .roundRect(x - width / 2, y - height / 2, width, height, 20)
      .fill({ color: 0x10194a, alpha: 0.95 });
    this.scoreCardGraphic
      .roundRect(x - width / 2, y - height / 2, width, height, 20)
      .stroke({ color: 0xffb300, width: 2.5 });
  }

  private spawnInitialCoins(): void {
    if (!this.coinPool || !this.coinLayer || !this.fieldBounds) {
      return;
    }

    const { left, right } = this.fieldBounds;
    const centerX = (left + right) / 2;

    // Arrange an appealing, natural stack/heap of coins in the lower half (Y = 360..465)
    // Layer 1 (Bottom foundation: 6 coins right above moving bottom pusher)
    for (let i = 0; i < 6; i++) {
      const coin = this.coinPool.acquire();
      const x = left + 28 + i * 44 + randomRange(-4, 4);
      const y = GAME_CONFIG.pusherY - 22 + randomRange(-3, 3);
      coin.activate(x, y, false);
      this.coinLayer.addChild(coin);
      this.activeCoins.push(coin);
    }

    // Layer 2 (Middle heap: 5 coins)
    for (let i = 0; i < 5; i++) {
      const coin = this.coinPool.acquire();
      const x = left + 48 + i * 42 + randomRange(-4, 4);
      const y = GAME_CONFIG.pusherY - 55 + randomRange(-3, 3);
      coin.activate(x, y, false);
      this.coinLayer.addChild(coin);
      this.activeCoins.push(coin);
    }

    // Layer 3 (Upper heap: 4 coins)
    for (let i = 0; i < 4; i++) {
      const coin = this.coinPool.acquire();
      const x = centerX - 55 + i * 36 + randomRange(-4, 4);
      const y = GAME_CONFIG.pusherY - 88 + randomRange(-3, 3);
      coin.activate(x, y, false);
      this.coinLayer.addChild(coin);
      this.activeCoins.push(coin);
    }
  }

  private setupTicker(): void {
    this.app?.ticker.add(this.onTick, this);
  }

  private setupResize(container: HTMLElement): void {
    this.onWindowResize = () => this.handleResize(container);
    window.addEventListener('resize', this.onWindowResize);
    this.handleResize(container);
  }

  private onWindowResize = (): void => {
    // todo
  };

  private handleResize(container: HTMLElement): void {
    if (!this.app || !this.worldContainer) {
      return;
    }

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

  private setupInputUnlock(): void {
    const unlock = (): void => {
      this.audio.unlock();
      window.removeEventListener('pointerdown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
  }

  private onDropRequested(targetX?: number): void {
    if (this.gameState.isInputLocked || !this.stateMachine.is('READY')) {
      return;
    }

    const now = performance.now();
    if (now - this.lastDropTime < GAME_CONFIG.dropCooldownMs) {
      return;
    }
    this.lastDropTime = now;

    this.gameState.dropCount += 1;
    this.rewardSystem?.onNewDrop();

    if (this.gameState.dropCount === 3) {
      this.physics.triggerJackpotBoost();
    }

    this.spawnDroppedCoin(targetX);
    this.stateMachine.transition('DROPPING');
    this.eventBus.emit(GameEvents.DROP_STARTED);
    this.audio.play('drop');
  }

  private spawnDroppedCoin(targetX?: number): void {
    if (!this.coinPool || !this.coinLayer || !this.fieldBounds) {
      return;
    }

    const coin = this.coinPool.acquire();
    const centerX = (this.fieldBounds.left + this.fieldBounds.right) / 2;

    let spawnX = centerX;
    if (targetX !== undefined) {
      spawnX = Math.max(this.fieldBounds.left + 20, Math.min(this.fieldBounds.right - 20, targetX));
    } else {
      if (this.gameState.dropCount === 1) {
        spawnX = centerX + randomRange(-20, 20);
      } else if (this.gameState.dropCount === 2) {
        spawnX = centerX + randomRange(-45, 45);
      } else {
        spawnX = centerX + randomRange(-15, 15);
      }
    }

    const spawnY = this.fieldBounds.top + COIN_CONFIG.radius + 8;
    coin.activate(spawnX, spawnY, true);

    const impulseY = this.gameState.dropCount === 3 ? 180 : 130;
    coin.applyImpulse(randomRange(-20, 20), impulseY);

    this.coinLayer.addChild(coin);
    this.activeCoins.push(coin);

    const spawnTween = new Tween({
      duration: 0.16,
      easing: easeOutCubic,
      onUpdate: (progress) => {
        coin.scale.set(0.4 + progress * 0.6);
      },
    });
    this.tweenManager.add(spawnTween);
  }

  private onTick = (ticker: Ticker): void => {
    if (this.destroyed) {
      return;
    }

    const deltaSeconds = ticker.deltaMS / 1000;

    this.tweenManager.update(deltaSeconds);
    this.dropButton?.update(deltaSeconds);
    this.rewardPopup?.update(deltaSeconds);
    this.ctaPopup?.update(deltaSeconds);
    this.particleSystem?.update(deltaSeconds);
    this.updateScreenShake(deltaSeconds);
    this.updateScoreCounter(deltaSeconds);

    if (!this.fieldBounds) {
      return;
    }

    this.physics.update(this.activeCoins, this.fieldBounds, deltaSeconds);
    this.collision.resolveCoinCollisions(this.activeCoins);
    this.drawPusher();

    const rewardResult = this.rewardSystem?.checkRewards(this.activeCoins, this.fieldBounds);
    if (rewardResult?.collected && rewardResult.coin) {
      this.stateMachine.transition('REWARD');
      return;
    }

    if (this.stateMachine.is('DROPPING') && this.collision.isSettled(this.activeCoins)) {
      this.settleFrameCount += 1;
      if (this.settleFrameCount >= GAME_CONFIG.settleFramesRequired) {
        this.finishDropCycle();
      }
    }
  };

  private finishDropCycle(): void {
    if (this.rewardSystem?.shouldShowCta()) {
      this.stateMachine.transition('CTA');
    } else {
      this.stateMachine.transition('READY');
    }
  }

  private onCoinCollected(amount: number, coin: Coin, isJackpot = false): void {
    this.audio.play('reward');

    if (isJackpot) {
      this.particleSystem?.burst(coin.state.positionX, coin.state.positionY, 0xffeb3b, 24);
      this.rewardPopup?.showBigJackpot(amount, GAME_CONFIG.logicalWidth / 2, 280);
      this.triggerScreenShake(12, 0.5);
    } else {
      this.particleSystem?.burst(coin.state.positionX, coin.state.positionY, 0xffd54f, 14);
      this.rewardPopup?.show(amount, coin.state.positionX, coin.state.positionY - 20);
      this.triggerScreenShake(6, 0.25);
    }

    const fadeTween = new Tween({
      duration: 0.35,
      onUpdate: (progress) => {
        coin.alpha = 1 - progress;
        coin.scale.set(1 + progress * 0.4);
      },
      onComplete: () => {
        this.removeCoin(coin);
        this.eventBus.emit(GameEvents.REWARD_SHOWN, { amount });
        this.scheduleAfterReward(isJackpot);
      },
    });
    this.tweenManager.add(fadeTween);
  }

  private scheduleAfterReward(isJackpot: boolean): void {
    const delayDuration = isJackpot ? 1.4 : 0.75;

    const delay = new Tween({
      duration: delayDuration,
      onUpdate: () => {},
      onComplete: () => {
        if (this.rewardSystem?.shouldShowCta()) {
          this.stateMachine.transition('CTA');
        } else {
          this.stateMachine.transition('READY');
        }
      },
    });
    this.tweenManager.add(delay);
  }

  private scheduleCta(): void {
    const delay = new Tween({
      duration: 0.4,
      onUpdate: () => {},
      onComplete: () => {
        this.stateMachine.transition('CTA');
      },
    });
    this.tweenManager.add(delay);
  }

  private removeCoin(coin: Coin): void {
    const index = this.activeCoins.indexOf(coin);
    if (index >= 0) {
      this.activeCoins.splice(index, 1);
    }
    if (this.coinLayer) {
      this.coinLayer.removeChild(coin);
    }
    this.coinPool?.release(coin);
  }

  private updateScoreCounter(deltaSeconds: number): void {
    if (this.displayedCoins < this.gameState.totalCoins) {
      const step = Math.max(1, Math.ceil((this.gameState.totalCoins - this.displayedCoins) * deltaSeconds * 12));
      this.displayedCoins = Math.min(this.gameState.totalCoins, this.displayedCoins + step);
      if (this.coinCounterText) {
        this.coinCounterText.text = `🪙 ${this.displayedCoins} COINS`;
      }
    }
  }

  private triggerScreenShake(
    intensity: number = GAME_CONFIG.screenShakeIntensity,
    duration: number = GAME_CONFIG.screenShakeDuration,
  ): void {
    this.shakeTime = duration;
    this.screenShakeIntensity = intensity;
  }

  private updateScreenShake(deltaSeconds: number): void {
    if (!this.worldContainer) {
      return;
    }

    if (this.shakeTime <= 0) {
      this.worldContainer.pivot.set(0, 0);
      return;
    }

    this.shakeTime -= deltaSeconds;
    const currentIntensity =
      this.screenShakeIntensity * (this.shakeTime / GAME_CONFIG.screenShakeDuration);
    this.worldContainer.pivot.set(
      (Math.random() - 0.5) * currentIntensity,
      (Math.random() - 0.5) * currentIntensity,
    );
  }

  private hideLoadingScreen(): void {
    const loading = document.getElementById('loading-screen');
    loading?.classList.add('hidden');
  }
}
