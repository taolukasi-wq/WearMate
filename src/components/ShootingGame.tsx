import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from '../i18n';

interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Bullet extends Entity {
  color: string;
}

interface Enemy extends Entity {
  hp: number;
  maxHp: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
}

export default function ShootingGame() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const keysRef = useRef<Record<string, boolean>>({});
  const lastShotRef = useRef<number>(0);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const [level, setLevel] = useState(1);

  const gameStateRef = useRef({
    player: { x: 0, y: 0, width: 40, height: 40, speed: 6 },
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    particles: [] as Particle[],
    stars: [] as Star[],
    score: 0,
    lives: 3,
    lastEnemySpawn: 0,
    enemySpawnInterval: 800,
    level: 1,
    width: 0,
    height: 0,
  });

  const resetGame = useCallback(() => {
    const state = gameStateRef.current;
    state.bullets = [];
    state.enemies = [];
    state.particles = [];
    state.score = 0;
    state.lives = 3;
    state.lastEnemySpawn = 0;
    state.enemySpawnInterval = 800;
    state.level = 1;
    state.player.x = state.width / 2 - state.player.width / 2;
    state.player.y = state.height - state.player.height - 20;
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setPaused(false);
  }, []);

  const initStars = useCallback((width: number, height: number) => {
    const stars: Star[] = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.6 + 0.2,
      });
    }
    gameStateRef.current.stars = stars;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(320, Math.floor(rect.width * dpr));
      canvas.height = Math.max(480, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const state = gameStateRef.current;
      state.width = rect.width;
      state.height = rect.height;
      state.player.y = rect.height - state.player.height - 20;
      state.player.x = Math.min(
        Math.max(state.player.x, 0),
        rect.width - state.player.width
      );
      if (state.stars.length === 0) {
        initStars(rect.width, rect.height);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
      }
      if (e.key === 'Escape' && started && !gameOver) {
        setPaused((p) => !p);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(requestRef.current);
    };
  }, [initStars, started, gameOver]);

  useEffect(() => {
    if (!started || gameOver || paused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameStateRef.current;
    state.player.x = state.width / 2 - state.player.width / 2;
    state.player.y = state.height - state.player.height - 20;

    const spawnEnemy = (timestamp: number) => {
      if (timestamp - state.lastEnemySpawn > state.enemySpawnInterval) {
        const size = 34 + Math.random() * 16;
        const hp = 1 + Math.floor(state.level / 3);
        const enemy: Enemy = {
          x: Math.random() * (state.width - size),
          y: -size,
          width: size,
          height: size,
          speed: 1.5 + Math.random() * 1.5 + state.level * 0.15,
          hp,
          maxHp: hp,
          color: `hsl(${10 + Math.random() * 50}, 90%, 60%)`,
        };
        state.enemies.push(enemy);
        state.lastEnemySpawn = timestamp;
      }
    };

    const update = (timestamp: number) => {
      const player = state.player;

      // Player movement
      if (keysRef.current['ArrowLeft'] || keysRef.current['a']) {
        player.x -= player.speed;
      }
      if (keysRef.current['ArrowRight'] || keysRef.current['d']) {
        player.x += player.speed;
      }
      player.x = Math.max(0, Math.min(state.width - player.width, player.x));

      // Shooting
      if (keysRef.current[' '] || keysRef.current['ArrowUp'] || keysRef.current['w']) {
        if (timestamp - lastShotRef.current > 180) {
          state.bullets.push({
            x: player.x + player.width / 2 - 3,
            y: player.y,
            width: 6,
            height: 14,
            speed: 10,
            color: '#67e8f9',
          });
          lastShotRef.current = timestamp;
        }
      }

      // Update stars
      state.stars.forEach((star) => {
        star.y += star.speed;
        if (star.y > state.height) {
          star.y = 0;
          star.x = Math.random() * state.width;
        }
      });

      // Update bullets
      state.bullets = state.bullets.filter((b) => {
        b.y -= b.speed;
        return b.y + b.height > 0;
      });

      // Update enemies
      spawnEnemy(timestamp);
      state.enemies = state.enemies.filter((enemy) => {
        enemy.y += enemy.speed;

        // Check collision with player
        if (
          player.x < enemy.x + enemy.width &&
          player.x + player.width > enemy.x &&
          player.y < enemy.y + enemy.height &&
          player.y + player.height > enemy.y
        ) {
          state.lives -= 1;
          setLives(state.lives);
          createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color);
          if (state.lives <= 0) {
            setGameOver(true);
          }
          return false;
        }

        // Enemy reached bottom
        if (enemy.y > state.height) {
          state.lives -= 1;
          setLives(state.lives);
          if (state.lives <= 0) {
            setGameOver(true);
          }
          return false;
        }

        return true;
      });

      // Bullet-enemy collisions
      for (let i = state.bullets.length - 1; i >= 0; i--) {
        const b = state.bullets[i];
        let hit = false;
        for (let j = state.enemies.length - 1; j >= 0; j--) {
          const e = state.enemies[j];
          if (
            b.x < e.x + e.width &&
            b.x + b.width > e.x &&
            b.y < e.y + e.height &&
            b.y + b.height > e.y
          ) {
            e.hp -= 1;
            hit = true;
            if (e.hp <= 0) {
              createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.color);
              state.score += 10 * e.maxHp;
              state.enemies.splice(j, 1);
              const newLevel = 1 + Math.floor(state.score / 200);
              if (newLevel !== state.level) {
                state.level = newLevel;
                state.enemySpawnInterval = Math.max(250, 800 - state.level * 60);
                setLevel(state.level);
              }
            }
            break;
          }
        }
        if (hit) {
          state.bullets.splice(i, 1);
        }
      }

      // Update particles
      state.particles = state.particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        return p.life > 0;
      });

      if (state.score !== score) {
        setScore(state.score);
      }
    };

    const createExplosion = (x: number, y: number, color: string) => {
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        state.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 30 + Math.random() * 20,
          maxLife: 50,
          color,
          size: Math.random() * 3 + 2,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, state.width, state.height);

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, state.height);
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, state.width, state.height);

      // Stars
      state.stars.forEach((star) => {
        ctx.globalAlpha = star.alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Player
      const player = state.player;
      ctx.save();
      ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(0, -player.height / 2);
      ctx.lineTo(-player.width / 2, player.height / 2);
      ctx.lineTo(0, player.height / 2 - 8);
      ctx.lineTo(player.width / 2, player.height / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Bullets
      state.bullets.forEach((b) => {
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.width, b.height, 3);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Enemies
      state.enemies.forEach((e) => {
        ctx.save();
        ctx.translate(e.x + e.width / 2, e.y + e.height / 2);
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 10;

        // Enemy body
        ctx.beginPath();
        ctx.arc(0, 0, e.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Enemy eyes
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(-e.width / 5, -e.width / 8, e.width / 10, 0, Math.PI * 2);
        ctx.arc(e.width / 5, -e.width / 8, e.width / 10, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        if (e.maxHp > 1) {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-e.width / 2, -e.height / 2 - 8, e.width, 4);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(-e.width / 2, -e.height / 2 - 8, e.width * (e.hp / e.maxHp), 4);
        }
        ctx.restore();
      });

      // Particles
      state.particles.forEach((p) => {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const loop = (timestamp: number) => {
      update(timestamp);
      draw();
      if (!gameOver) {
        requestRef.current = requestAnimationFrame(loop);
      }
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [started, gameOver, paused, score]);

  const handleStart = () => {
    resetGame();
    setStarted(true);
  };

  const handleRestart = () => {
    resetGame();
    setGameOver(false);
    // Restart loop will happen via useEffect re-run
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-surface-container-low rounded-3xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-on-surface">{t('gameTitle')}</h2>
            <p className="text-sm text-on-surface-variant">{t('gameControls')}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-primary">{score}</div>
            <div className="text-xs text-on-surface-variant">{t('gameScore')}</div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-on-surface">{t('gameLives')}</span>
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-lg ${i < lives ? 'text-red-500' : 'text-gray-300'}`}
                >
                  ♥
                </span>
              ))}
            </div>
          </div>
          <div className="text-sm font-semibold text-on-surface">
            {t('gameLevel')} <span className="text-primary">{level}</span>
          </div>
        </div>

        <div
          ref={containerRef}
          className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border border-outline-variant/30 bg-black"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full block"
          />

          {!started && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm text-white z-10">
              <h3 className="text-3xl font-black mb-2 text-center">{t('gameTitle')}</h3>
              <p className="text-sm mb-6 text-center max-w-[240px]">
                {t('gameIntro')}
              </p>
              <button
                type="button"
                onClick={handleStart}
                className="px-8 py-3 bg-primary text-on-primary rounded-full font-bold text-lg shadow-lg hover:scale-105 transition-transform cursor-pointer"
              >
                {t('gameStart')}
              </button>
            </div>
          )}

          {started && gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white z-10">
              <h3 className="text-3xl font-black mb-2">{t('gameOver')}</h3>
              <p className="text-xl mb-2">{t('finalScore')}: {score}</p>
              <p className="text-sm text-white/70 mb-6">{t('reachedLevel', { level })}</p>
              <button
                type="button"
                onClick={handleRestart}
                className="px-8 py-3 bg-primary text-on-primary rounded-full font-bold text-lg shadow-lg hover:scale-105 transition-transform cursor-pointer"
              >
                {t('gameRestart')}
              </button>
            </div>
          )}

          {started && paused && !gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white z-10">
              <h3 className="text-2xl font-black mb-4">{t('paused')}</h3>
              <p className="text-sm text-white/70">{t('pressEscToContinue')}</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            disabled={!started || gameOver}
            className="px-6 py-2 bg-surface-container rounded-full text-sm font-semibold text-on-surface hover:bg-surface-container-high disabled:opacity-40 transition-colors cursor-pointer"
          >
            {paused ? t('resume') : t('pause')}
          </button>
        </div>
      </div>
    </div>
  );
}
