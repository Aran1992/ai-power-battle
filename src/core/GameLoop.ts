import { Unit } from '@game/Unit';
import { CombatSystem } from '@game/Combat';
import { WaveManager, HERO_CONFIG } from '@game/WaveManager';

/** 游戏状态枚举 */
export enum GameState {
  Init = 'init',
  Playing = 'playing',
  WaveBreak = 'waveBreak',
  Choosing = 'choosing',
  Victory = 'victory',
  Defeat = 'defeat',
}

/** 游戏循环 — 驱动游戏的核心类 */
export class GameLoop {
  state: GameState = GameState.Init;
  elapsed: number = 0;

  // 我方单位
  playerUnits: Unit[] = [];

  // 子系统
  combat: CombatSystem = new CombatSystem();
  waves: WaveManager;

  // 回调
  private onStateChange?: (state: GameState) => void;

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.waves = new WaveManager(width);
  }

  /** 开始游戏 */
  start(): void {
    this.setState(GameState.Playing);

    // 创建主角（画面下方偏上）
    const hero = new Unit(
      { ...HERO_CONFIG },
      this.width / 2,
      this.height - 200,
    );
    this.playerUnits.push(hero);

    // 开始第一波
    this.waves.startWave(1);
    console.log(`[GameLoop] 游戏开始！主角 HP=${hero.hp}`);
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
        // TODO Step 3: 三选一
        break;
      default:
        break;
    }
  }

  // ─── Playing ────────────────────────────────────────

  private updatePlaying(dt: number): void {
    // 1. 单位移动
    this.updateMovement(dt);

    // 2. 战斗系统（寻敌 + 飞弹）
    this.combat.update(
      { player: this.playerUnits, enemy: this.waves.enemies },
      dt,
    );

    // 3. 波次管理（生成敌人）
    this.waves.update(dt);

    // 4. 清理死亡单位
    this.cleanupDead();

    // 5. 胜负判定
    this.checkCombatResult();
  }

  private updateMovement(dt: number): void {
    // 我方主角自动向上移动
    for (const u of this.playerUnits) {
      if (!u.alive) continue;
      // 限制在画面内
      const targetY = Math.max(60, u.y - u.speed * (dt / 1000));
      u.y = targetY;
      u.x = Math.max(30, Math.min(this.width - 30, u.x));
    }

    // 敌方向下移动（向主角方向）
    for (const e of this.waves.enemies) {
      if (!e.alive) continue;

      // 找最近的我方单位作为目标
      let nearestDist = Infinity;
      let nearest: Unit | null = null;
      for (const p of this.playerUnits) {
        if (!p.alive) continue;
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = p;
        }
      }

      if (nearest) {
        // 远程敌人在攻击范围内时停止
        if (e.attackType === 'ranged' as never && e.isInRange(nearest)) {
          continue; // 不移动，只攻击
        }
        // 近战或不在范围内：向目标移动
        e.moveToward(nearest.x, nearest.y, dt);
      }
    }
  }

  // ─── Wave Break ─────────────────────────────────────

  private updateWaveBreak(_dt: number): void {
    if (this.waves.isBreakOver()) {
      if (this.waves.currentWave >= this.waves.maxWaves) {
        this.setState(GameState.Victory);
      } else {
        const nextWave = this.waves.currentWave + 1;
        this.waves.startWave(nextWave);
        this.setState(GameState.Playing);
        console.log(`[GameLoop] 第 ${nextWave} 波开始！`);
      }
    }
  }

  // ─── 胜负判定 ───────────────────────────────────────

  private checkCombatResult(): void {
    // 我方全灭 → 失败
    if (this.playerUnits.every((u) => !u.alive)) {
      this.setState(GameState.Defeat);
      return;
    }

    // 杀光当前波 → 进入波间休息 + 升级
    if (this.waves.isWaveCleared()) {
      this.waves.startBreak();
      // TODO Step 3: 触发三选一
      // 暂时直接进入波间 -> 下一波
      this.setState(GameState.WaveBreak);
      console.log(`[GameLoop] 第 ${this.waves.currentWave} 波清除！`);
    }
  }

  // ─── 辅助 ───────────────────────────────────────────

  private cleanupDead(): void {
    this.playerUnits = this.playerUnits.filter((u) => u.alive);
    this.waves.cleanupDead();
  }

  /** 获取当前波次 */
  get currentWave(): number {
    return this.waves.currentWave;
  }

  get maxWaves(): number {
    return this.waves.maxWaves;
  }

  /** 注册状态变化回调 */
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
