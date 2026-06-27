/** 游戏状态枚举 */
export enum GameState {
  Init = 'init',
  Playing = 'playing',
  WaveBreak = 'waveBreak',
  Choosing = 'choosing',
  Victory = 'victory',
  Defeat = 'defeat',
}

/** 游戏循环 - 驱动游戏的核心类 */
export class GameLoop {
  state: GameState = GameState.Init;
  elapsed: number = 0;
  currentWave: number = 0;
  maxWaves: number = 20;

  private onStateChange?: (state: GameState) => void;

  constructor(
    readonly width: number,
    readonly height: number,
  ) {}

  /** 开始游戏 */
  start(): void {
    this.setState(GameState.Playing);
    this.currentWave = 1;
    console.log(`[GameLoop] 游戏开始！第 ${this.currentWave}/${this.maxWaves} 波`);
  }

  /** 每帧更新 */
  update(dt: number): void {
    this.elapsed += dt;

    switch (this.state) {
      case GameState.Playing:
        this.updatePlaying(dt);
        break;
      case GameState.WaveBreak:
        this.updateWaveBreak(dt);
        break;
      case GameState.Choosing:
        // 等待选择完成
        break;
      default:
        break;
    }
  }

  private updatePlaying(_dt: number): void {
    // TODO Step 2: 单位移动、战斗判定
  }

  private updateWaveBreak(_dt: number): void {
    // TODO Step 2: 波间倒计时
  }

  /** 注册状态变化回调（供 UI 使用） */
  onStateChanged(cb: (state: GameState) => void): void {
    this.onStateChange = cb;
  }

  private setState(next: GameState): void {
    if (this.state === next) return;
    console.log(`[GameLoop] ${this.state} → ${next}`);
    this.state = next;
    this.onStateChange?.(next);
  }
}
