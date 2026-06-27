import { Application, Text, TextStyle } from 'pixi.js';
import { GameLoop, GameState } from '@core/GameLoop';

const GAME_WIDTH = 720;
const GAME_HEIGHT = 1440;

(async () => {
  const app = new Application();

  await app.init({
    background: 0x1a1a2e,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio, 2),
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  });

  const container = document.getElementById('game-container')!;
  container.appendChild(app.canvas as HTMLCanvasElement);

  // 竖屏比例缩放
  const fitCanvas = () => {
    const canvas = app.canvas as HTMLCanvasElement;
    const scaleX = window.innerWidth / GAME_WIDTH;
    const scaleY = window.innerHeight / GAME_HEIGHT;
    const scale = Math.min(scaleX, scaleY);
    canvas.style.width = `${GAME_WIDTH * scale}px`;
    canvas.style.height = `${GAME_HEIGHT * scale}px`;
    canvas.style.position = 'absolute';
    canvas.style.left = `${(window.innerWidth - GAME_WIDTH * scale) / 2}px`;
    canvas.style.top = `${(window.innerHeight - GAME_HEIGHT * scale) / 2}px`;
  };
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  // 调试文本
  const debugStyle = new TextStyle({
    fontFamily: 'monospace',
    fontSize: 20,
    fill: 0x00ff88,
  });
  const debugText = new Text({ text: '', style: debugStyle });
  debugText.x = 10;
  debugText.y = 10;
  app.stage.addChild(debugText);

  // 创建游戏循环
  const game = new GameLoop(GAME_WIDTH, GAME_HEIGHT);

  game.onStateChanged((state) => {
    const stateNames: Record<GameState, string> = {
      [GameState.Init]: '初始化',
      [GameState.Playing]: '战斗中',
      [GameState.WaveBreak]: '波间休息',
      [GameState.Choosing]: '三选一',
      [GameState.Victory]: '胜利！',
      [GameState.Defeat]: '失败...',
    };
    debugText.text = `状态: ${stateNames[state]} | 波次: ${game.currentWave}/${game.maxWaves}`;
  });

  game.start();

  // 主循环
  let lastTime = performance.now();
  app.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min(now - lastTime, 50);
    lastTime = now;
    game.update(dt);
  });
})();
