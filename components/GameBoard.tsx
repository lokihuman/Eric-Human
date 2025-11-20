import React, { useEffect, useRef, useCallback } from 'react';
import { GameStatus, Direction, Coordinate } from '../types';

interface GameBoardProps {
  status: GameStatus;
  score: number;
  snake: Coordinate[];
  food: Coordinate;
  direction: Direction;
  onMove: (newHead: Coordinate, grew: boolean) => void;
  onGameOver: () => void;
  width: number;
  height: number;
}

const CELL_SIZE = 25;

export const GameBoard: React.FC<GameBoardProps> = ({
  status,
  score,
  snake,
  food,
  direction,
  onMove,
  onGameOver,
  width,
  height
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  // Speed increases as score increases (lower interval = faster)
  const speedRef = useRef<number>(150); 
  
  // Calculate speed based on score
  useEffect(() => {
    const baseSpeed = 150;
    const speedDecay = Math.min(100, score * 2); // Cap max speed increase
    speedRef.current = Math.max(50, baseSpeed - speedDecay);
  }, [score]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    // 1. Clear with a slight transparent black for trail effect (optional, but kept clean for snake)
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw Grid Background (Cyberpunk style)
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x <= width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, height * CELL_SIZE);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(width * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    // Draw Food (Glowing Pulse)
    if (status !== GameStatus.IDLE) {
        const pulseSize = Math.sin(Date.now() / 200) * 2;
        
        ctx.fillStyle = '#ff00ff'; // Neon Pink
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 15;
        ctx.fillRect(
            food.x * CELL_SIZE + 2 - pulseSize/2, 
            food.y * CELL_SIZE + 2 - pulseSize/2, 
            CELL_SIZE - 4 + pulseSize, 
            CELL_SIZE - 4 + pulseSize
        );
        
        // Inner core of food
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.fillRect(
            food.x * CELL_SIZE + 8, 
            food.y * CELL_SIZE + 8, 
            CELL_SIZE - 16, 
            CELL_SIZE - 16
        );
    }

    // Draw Snake
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      
      if (isHead) {
          ctx.fillStyle = '#0aff0a'; // Neon Green Head
          ctx.shadowColor = '#0aff0a';
          ctx.shadowBlur = 20;
      } else {
          // Gradient fade for tail
          const opacity = Math.max(0.3, 1 - index / (snake.length + 5));
          ctx.fillStyle = `rgba(0, 243, 255, ${opacity})`; // Neon Blue Body
          ctx.shadowColor = '#00f3ff';
          ctx.shadowBlur = 10;
      }

      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
      
      // Reset shadow for performance
      ctx.shadowBlur = 0;
    });

  }, [snake, food, width, height, status]);

  const gameLoop = useCallback((time: number) => {
    if (status !== GameStatus.PLAYING) {
        // Still draw if paused/gameover to show state
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) draw(ctx);
        }
        return; 
    }

    const deltaTime = time - lastTimeRef.current;

    if (deltaTime > speedRef.current) {
      // Move Snake
      const head = snake[0];
      const newHead = { ...head };

      switch (direction) {
        case Direction.UP: newHead.y -= 1; break;
        case Direction.DOWN: newHead.y += 1; break;
        case Direction.LEFT: newHead.x -= 1; break;
        case Direction.RIGHT: newHead.x += 1; break;
      }

      // Check Collision (Walls)
      if (
        newHead.x < 0 || 
        newHead.x >= width || 
        newHead.y < 0 || 
        newHead.y >= height
      ) {
        onGameOver();
        return;
      }

      // Check Collision (Self) - start from index 0 because head hasn't moved yet in state, 
      // strictly we check if newHead exists in current snake body. 
      // But since tail moves, we don't check the very last segment if we are not eating.
      // To simplify: just check if newHead is in snake.
      // However, if we don't eat, the tail pops, so hitting the tail tip is valid.
      // Let's simplify: Collision if newHead touches any part of the CURRENT snake.
      // Refined: If we eat, snake grows, tail doesn't move. Collision with tail is bad.
      // If we don't eat, tail moves. Collision with current tail tip is actually fine (it will move away).
      
      // Quick check: Is new head hitting body?
      // We treat collision with *any* existing segment as death.
      for (let i = 0; i < snake.length - 1; i++) {
          if (newHead.x === snake[i].x && newHead.y === snake[i].y) {
              onGameOver();
              return;
          }
      }

      // Check Food
      const grew = newHead.x === food.x && newHead.y === food.y;
      
      onMove(newHead, grew);
      lastTimeRef.current = time;
    }

    if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) draw(ctx);
    }
    
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [status, snake, direction, food, width, height, onMove, onGameOver, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameLoop]);

  return (
    <div className="relative border-4 border-cyber-dark bg-cyber-black shadow-[0_0_30px_rgba(0,243,255,0.1)] rounded-lg overflow-hidden">
        <canvas
            ref={canvasRef}
            width={width * CELL_SIZE}
            height={height * CELL_SIZE}
            className="block"
        />
        
        {/* Screen Glitch Overlay for Game Over */}
        {status === GameStatus.GAME_OVER && (
            <div className="absolute inset-0 flex items-center justify-center bg-cyber-black/80 backdrop-blur-sm z-10">
                <h2 className="text-5xl font-display font-bold text-cyber-neonPink animate-pulse tracking-widest drop-shadow-[0_0_10px_rgba(255,0,255,0.8)]">
                    SYSTEM FAILURE
                </h2>
            </div>
        )}

        {/* Pause Overlay */}
        {status === GameStatus.PAUSED && (
            <div className="absolute inset-0 flex items-center justify-center bg-cyber-black/60 z-10">
                <h2 className="text-3xl font-mono text-cyber-neonYellow animate-pulse tracking-widest">
                    [ CONNECTION SUSPENDED ]
                </h2>
            </div>
        )}
    </div>
  );
};