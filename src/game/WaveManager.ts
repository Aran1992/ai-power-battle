import { Unit, UnitConfig, Team, AttackType } from './Unit';

/** 我方主角配置 */
export const HERO_CONFIG: UnitConfig = {
  hp: 100,
  attack: 15,
  attackRange: 200,
  attackCooldown: 800,
  speed: 80,
  attackType: AttackType.Ranged,
  team: Team.Player,
};

/** 近战敌人配置 */
export const MELEE_ENEMY_CONFIG: UnitConfig = {
  hp: 40,
  attack: 10,
  attackRange: 50,
  attackCooldown: 1000,
  speed: 60,
  attackType: AttackType.Melee,
  team: Team.Enemy,
};

/** 远程敌人配置 */
export const RANGED_ENEMY_CONFIG: UnitConfig = {
  hp: 30,
  attack: 8,
  attackRange: 300,
  attackCooldown: 1500,
  speed: 40,
  attackType: AttackType.Ranged,
  team: Team.Enemy,
};

/** 波次配置 */
export interface WaveConfig {
  total: number; // 这波总敌人数量
  meleeRatio: number; // 近战占比 0-1
  spawnInterval: number; // 出生间隔 ms
}

/** 波次管理器 */
export class WaveManager {
  currentWave: number = 0;
  maxWaves: number = 20;

  /** 波间计时（ms） */
  private breakTimer: number = 0;
  private readonly breakDuration: number = 2000;

  /** 当前波敌人生成计时 */
  private spawnTimer: number = 0;
  private spawnedThisWave: number = 0;
  private currentWaveConfig: WaveConfig | null = null;

  /** 是否正在波间休息 */
  inBreak: boolean = false;

  /** 所有敌方单位 */
  enemies: Unit[] = [];

  constructor(readonly mapWidth: number) {}

  /** 开始新一波 */
  startWave(wave: number): void {
    this.currentWave = wave;
    this.spawnedThisWave = 0;
    this.spawnTimer = 0;
    this.inBreak = false;
    this.currentWaveConfig = this.getWaveConfig(wave);
  }

  /** 开始波间休息 */
  startBreak(): void {
    this.inBreak = true;
    this.breakTimer = this.breakDuration;
    this.currentWaveConfig = null;
  }

  /** 每帧更新 */
  update(dt: number): void {
    if (this.inBreak) {
      this.breakTimer -= dt;
      return;
    }

    // 生成敌人
    if (this.currentWaveConfig && this.spawnedThisWave < this.currentWaveConfig.total) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnEnemy();
        this.spawnTimer = this.currentWaveConfig.spawnInterval;
      }
    }
  }

  /** 波间休息是否结束 */
  isBreakOver(): boolean {
    return this.inBreak && this.breakTimer <= 0;
  }

  /** 当前波所有敌人是否已生成且全部死亡 */
  isWaveCleared(): boolean {
    if (!this.currentWaveConfig) return false;
    if (this.spawnedThisWave < this.currentWaveConfig.total) return false;
    return this.enemies.every((e) => !e.alive);
  }

  /** 获取指定波次的配置 */
  private getWaveConfig(wave: number): WaveConfig {
    const total = 3 + wave * 2; // 第1波5个, 第20波43个
    return {
      total,
      meleeRatio: 0.55, // 55% 近战
      spawnInterval: Math.max(300, 800 - wave * 20), // 越后面越密集
    };
  }

  /** 生成一个敌人 */
  private spawnEnemy(): void {
    if (!this.currentWaveConfig) return;

    const isMelee = Math.random() < this.currentWaveConfig.meleeRatio;
    const config = isMelee ? { ...MELEE_ENEMY_CONFIG } : { ...RANGED_ENEMY_CONFIG };
    const x = 40 + Math.random() * (this.mapWidth - 80);
    const y = -30;

    const enemy = new Unit(config, x, y);
    this.enemies.push(enemy);
    this.spawnedThisWave++;
  }

  /** 清理已死亡敌人（定期调用） */
  cleanupDead(): void {
    this.enemies = this.enemies.filter((e) => e.alive);
  }
}
