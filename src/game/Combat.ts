/** 飞弹 */
export interface Projectile {
  x: number;
  y: number;
  speed: number; // px/s
  damage: number;
  targetId: number; // 目标单位 ID
  ownerTeam: 'player' | 'enemy';
}

/** 战斗系统 — 管理寻敌、攻击、飞弹 */
export class CombatSystem {
  projectiles: Projectile[] = [];
  private projectileSpeed = 400; // px/s

  /** 每帧更新 */
  update(units: { player: Unit[]; enemy: Unit[] }, dt: number): void {
    // 我方单位寻敌攻击
    for (const u of units.player) {
      if (!u.alive) continue;
      u.tickCooldown(dt);
      if (!u.canAttack()) continue;

      const target = this.findNearestEnemy(u, units.enemy);
      if (target) {
        this.shoot(u, target);
      }
    }

    // 敌方单位寻敌攻击
    for (const u of units.enemy) {
      if (!u.alive) continue;
      u.tickCooldown(dt);
      if (!u.canAttack()) continue;

      const target = this.findNearestEnemy(u, units.player);
      if (target) {
        this.shoot(u, target);
      }
    }

    // 飞弹飞行
    this.updateProjectiles(units, dt);
  }

  /** 发射飞弹 */
  private shoot(attacker: Unit, target: Unit): void {
    attacker.resetCooldown();
    this.projectiles.push({
      x: attacker.x,
      y: attacker.y,
      speed: this.projectileSpeed,
      damage: attacker.attack,
      targetId: target.id,
      ownerTeam: attacker.team,
    });
  }

  /** 飞弹飞行 + 命中判定 */
  private updateProjectiles(
    units: { player: Unit[]; enemy: Unit[] },
    dt: number,
  ): void {
    const speedScale = dt / 1000;
    const alive: Projectile[] = [];

    for (const p of this.projectiles) {
      // 找到目标
      const allUnits = [...units.player, ...units.enemy];
      const target = allUnits.find((u) => u.id === p.targetId);

      if (!target || !target.alive) {
        // 目标已死，飞弹消失
        continue;
      }

      // 飞弹向目标移动
      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = p.speed * speedScale;

      if (step >= dist) {
        // 命中
        target.takeDamage(p.damage);
        continue; // 飞弹消失
      }

      p.x += (dx / dist) * step;
      p.y += (dy / dist) * step;
      alive.push(p);
    }

    this.projectiles = alive;
  }

  /** 寻找最近的存活敌人 */
  private findNearestEnemy(self: Unit, enemies: Unit[]): Unit | null {
    let nearest: Unit | null = null;
    let minDist = Infinity;

    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.x - self.x;
      const dy = e.y - self.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= self.attackRange && dist < minDist) {
        minDist = dist;
        nearest = e;
      }
    }

    return nearest;
  }
}

import { Unit } from './Unit';
