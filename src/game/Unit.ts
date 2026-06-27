/** 单位阵营 */
export enum Team {
  Player = 'player',
  Enemy = 'enemy',
}

/** 攻击类型 */
export enum AttackType {
  Melee = 'melee',
  Ranged = 'ranged',
}

/** 单位配置（数值） */
export interface UnitConfig {
  hp: number;
  attack: number;
  attackRange: number;
  attackCooldown: number; // ms
  speed: number; // px/s
  attackType: AttackType;
  team: Team;
}

/** 一个游戏单位 */
export class Unit {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attack: number;
  attackRange: number;
  attackCooldown: number;
  speed: number;
  attackType: AttackType;
  team: Team;

  /** 攻击冷却计时器（ms），归零时可攻击 */
  cooldownTimer: number = 0;

  /** 是否存活 */
  alive: boolean = true;

  /** 唯一 ID */
  readonly id: number;
  private static _nextId = 0;

  constructor(config: UnitConfig, x: number, y: number) {
    this.id = Unit._nextId++;
    this.x = x;
    this.y = y;
    this.hp = this.maxHp = config.hp;
    this.attack = config.attack;
    this.attackRange = config.attackRange;
    this.attackCooldown = config.attackCooldown;
    this.speed = config.speed;
    this.attackType = config.attackType;
    this.team = config.team;
  }

  /** 承受伤害 */
  takeDamage(dmg: number): void {
    if (!this.alive) return;
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  /** 治疗 */
  heal(amount: number): void {
    if (!this.alive) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  /** 是否死亡 */
  get isDead(): boolean {
    return !this.alive;
  }

  /** 向目标方向移动（返回是否到达） */
  moveToward(tx: number, ty: number, dt: number): boolean {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return true;

    const step = this.speed * (dt / 1000);
    if (step >= dist) {
      this.x = tx;
      this.y = ty;
      return true;
    }
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    return false;
  }

  /** 向指定方向移动（无目标点） */
  moveDirection(dx: number, dy: number, dt: number): void {
    const step = this.speed * (dt / 1000);
    this.x += dx * step;
    this.y += dy * step;
  }

  /** 是否可以对目标攻击 */
  canAttack(): boolean {
    return this.alive && this.cooldownTimer <= 0;
  }

  /** 目标是否在攻击范围内 */
  isInRange(target: Unit): boolean {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.attackRange;
  }

  /** 更新冷却 */
  tickCooldown(dt: number): void {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dt;
    }
  }

  /** 开始攻击冷却 */
  resetCooldown(): void {
    this.cooldownTimer = this.attackCooldown;
  }
}
