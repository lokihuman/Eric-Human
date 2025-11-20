import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Skull, Trophy, Activity, Cpu } from 'lucide-react';
import { GameBoard } from './components/GameBoard';
import { CyberPanel, CyberButton, ScanlineOverlay } from './components/CyberUI';
import { GameStatus, Direction, Coordinate, SystemLog } from './types';
import { generateSystemMessage } from './services/geminiService';

// Game Constants
const BOARD_WIDTH = 25;
const BOARD_HEIGHT = 25; // Smaller board for better fit on standard screens
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 }
];

const getRandomPosition = (width: number, height: number, snake: Coordinate[]): Coordinate => {
  let newPos: Coordinate;
  let isCollision;
  do {
    newPos = {
      x: Math.floor(Math.random() * width),
      y: Math.floor(Math.random() * height)
    };
    // eslint-disable-next-line no-loop-func
    isCollision = snake.some(segment => segment.x === newPos.x && segment.y === newPos.y);
  } while (isCollision);
  return newPos;
};

function App() {
  // State
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [snake, setSnake] = useState<Coordinate[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Coordinate>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>(Direction.UP);
  const [nextDirection, setNextDirection] = useState<Direction>(Direction.UP);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  
  // Refs for logging scroll
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Audio Context (simulated for now via visual feedback)
  
  // Helpers
  const addLog = useCallback((message: string, type: SystemLog['type'] = 'info') => {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }),
      message,
      type
    };
    setLogs(prev => [...prev.slice(-15), newLog]); // Keep last 15 logs
  }, []);

  // Scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Initialize
  useEffect(() => {
    setFood(getRandomPosition(BOARD_WIDTH, BOARD_HEIGHT, INITIAL_SNAKE));
    addLog("Neural interface initialized...", 'info');
    addLog("Waiting for user input.", 'info');
  }, [addLog]);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (direction !== Direction.DOWN) setNextDirection(Direction.UP);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (direction !== Direction.UP) setNextDirection(Direction.DOWN);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (direction !== Direction.RIGHT) setNextDirection(Direction.LEFT);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (direction !== Direction.LEFT) setNextDirection(Direction.RIGHT);
          break;
        case ' ':
        case 'Enter':
           if (status === GameStatus.IDLE || status === GameStatus.GAME_OVER) startGame();
           else if (status === GameStatus.PLAYING) pauseGame();
           else if (status === GameStatus.PAUSED) resumeGame();
           break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, direction]);

  // Sync direction safely on each tick (handled inside game board via prop, but we need to update state for render)
  // Actually, we pass 'nextDirection' to the game logic to prevent 180 degree turns in one tick
  // But for the GameBoard component, we pass the *current* validated direction.
  // Let's update direction state only when we actually move.
  
  // Game Actions
  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(Direction.UP);
    setNextDirection(Direction.UP);
    setScore(0);
    setStatus(GameStatus.PLAYING);
    setFood(getRandomPosition(BOARD_WIDTH, BOARD_HEIGHT, INITIAL_SNAKE));
    setLogs([]);
    addLog("Breach protocol initiated. Good luck.", 'success');
  };

  const pauseGame = () => {
    setStatus(GameStatus.PAUSED);
    addLog("System frozen.", 'warning');
  };

  const resumeGame = () => {
    setStatus(GameStatus.PLAYING);
    addLog("Resuming data stream...", 'info');
  };

  const gameOver = useCallback(() => {
    setStatus(GameStatus.GAME_OVER);
    if (score > highScore) {
      setHighScore(score);
      addLog(`New High Score Record: ${score}`, 'success');
    }
    addLog("Connection lost. Neural feedback detected.", 'critical');
  }, [score, highScore, addLog]);

  // Core Move Logic (Called by GameBoard loop)
  const handleMove = useCallback(async (newHead: Coordinate, grew: boolean) => {
    // Update Direction to what was queued
    setDirection(nextDirection);

    let newSnake = [newHead, ...snake];
    
    if (!grew) {
      newSnake.pop();
    } else {
      // Ate food
      const newScore = score + 1;
      setScore(newScore);
      setFood(getRandomPosition(BOARD_WIDTH, BOARD_HEIGHT, newSnake));
      
      // AI Flavor Text every 5 points
      if (newScore % 5 === 0) {
        const msg = await generateSystemMessage(newScore);
        addLog(msg, 'success');
      } else {
        addLog("Data packet consumed.", 'info');
      }
    }

    setSnake(newSnake);
  }, [snake, score, nextDirection, addLog]);

  return (
    <div className="min-h-screen bg-cyber-black text-cyber-neonBlue font-mono selection:bg-cyber-neonPink selection:text-white flex flex-col overflow-hidden">
      <ScanlineOverlay />
      
      {/* Header */}
      <header className="relative z-10 border-b border-cyber-neonBlue/30 bg-cyber-dark/90 backdrop-blur p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Cpu className="text-cyber-neonPink animate-pulse" size={32} />
            <div>
              <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-cyber-neonBlue to-cyber-neonPink bg-clip-text text-transparent drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">
                CYBERSNAKE
              </h1>
              <p className="text-xs text-cyber-neonBlue/60 tracking-widest">NEURAL BREACH PROTOCOL V2.5</p>
            </div>
          </div>
          
          <div className="flex gap-6 text-right">
            <div>
              <p className="text-xs text-cyber-neonBlue/60 uppercase">Current Session</p>
              <p className="font-display text-2xl text-cyber-neonGreen drop-shadow-[0_0_5px_#0f0]">{score.toString().padStart(4, '0')}</p>
            </div>
            <div>
              <p className="text-xs text-cyber-neonPink/60 uppercase">Best Record</p>
              <p className="font-display text-2xl text-cyber-neonPink drop-shadow-[0_0_5px_#f0f]">{highScore.toString().padStart(4, '0')}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Stats & Controls */}
        <div className="lg:col-span-3 flex flex-col gap-6 order-2 lg:order-1">
          <CyberPanel title="System Status">
             <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-cyber-grid pb-2">
                  <span className="text-cyber-neonBlue/70">STATUS</span>
                  <span className={`font-bold ${
                    status === GameStatus.PLAYING ? 'text-cyber-neonGreen animate-pulse' : 
                    status === GameStatus.GAME_OVER ? 'text-cyber-neonPink' : 'text-cyber-neonYellow'
                  }`}>
                    {status}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-cyber-grid pb-2">
                  <span className="text-cyber-neonBlue/70">SPEED</span>
                  <span className="text-cyber-neonBlue">{(1 + score * 0.1).toFixed(1)}x</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-cyber-neonBlue/70">INTEGRITY</span>
                  <div className="w-24 h-2 bg-cyber-dark border border-cyber-neonBlue/30 rounded-full overflow-hidden">
                    <div className="h-full bg-cyber-neonGreen" style={{ width: '100%' }}></div>
                  </div>
                </div>
             </div>
          </CyberPanel>

          <CyberPanel title="Controls" icon={<Activity size={16} className="mr-2" />}>
            <div className="grid grid-cols-2 gap-4">
              {status === GameStatus.IDLE || status === GameStatus.GAME_OVER ? (
                <CyberButton onClick={startGame} className="col-span-2 flex items-center justify-center gap-2">
                  <Play size={16} /> Initialize
                </CyberButton>
              ) : (
                <>
                   {status === GameStatus.PLAYING ? (
                      <CyberButton onClick={pauseGame} variant="primary" className="flex items-center justify-center gap-2">
                        <Pause size={16} /> Halt
                      </CyberButton>
                   ) : (
                      <CyberButton onClick={resumeGame} variant="primary" className="flex items-center justify-center gap-2">
                        <Play size={16} /> Resume
                      </CyberButton>
                   )}
                   <CyberButton onClick={() => setStatus(GameStatus.GAME_OVER)} variant="danger" className="flex items-center justify-center gap-2">
                      <Skull size={16} /> Abort
                   </CyberButton>
                </>
              )}
            </div>
            <div className="mt-4 text-xs text-cyber-neonBlue/50 text-center">
              USE [W,A,S,D] OR ARROWS TO NAVIGATE
            </div>
          </CyberPanel>
        </div>

        {/* Center: Game Board */}
        <div className="lg:col-span-6 flex items-center justify-center order-1 lg:order-2">
          <GameBoard 
            status={status}
            score={score}
            snake={snake}
            food={food}
            direction={nextDirection}
            onMove={handleMove}
            onGameOver={gameOver}
            width={BOARD_WIDTH}
            height={BOARD_HEIGHT}
          />
        </div>

        {/* Right Column: Terminal Logs */}
        <div className="lg:col-span-3 flex flex-col h-[300px] lg:h-auto order-3">
          <CyberPanel title="Neural Logs" className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 max-h-[400px] pr-2">
              {logs.length === 0 && (
                 <div className="text-cyber-neonBlue/30 italic text-center mt-10">No activity detected...</div>
              )}
              {logs.map((log) => (
                <div key={log.id} className="animate-in slide-in-from-left-2 duration-300">
                  <span className="text-cyber-neonBlue/40">[{log.timestamp}]</span>{' '}
                  <span className={`${
                    log.type === 'critical' ? 'text-cyber-neonPink font-bold' : 
                    log.type === 'success' ? 'text-cyber-neonGreen' : 
                    log.type === 'warning' ? 'text-cyber-neonYellow' : 'text-gray-300'
                  }`}>
                    {log.type === 'critical' && '>> ERROR: '}
                    {log.type === 'success' && '>> '}
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
            <div className="mt-2 pt-2 border-t border-cyber-neonBlue/20">
              <div className="flex items-center">
                <span className="text-cyber-neonGreen mr-2 animate-pulse">➜</span>
                <span className="h-4 w-2 bg-cyber-neonGreen animate-pulse"></span>
              </div>
            </div>
          </CyberPanel>
        </div>

      </main>
      
      {/* Footer */}
      <footer className="relative z-10 text-center p-4 text-cyber-neonBlue/30 text-xs">
        SYSTEM_ID: GEMINI-2.5-FLASH // LATENCY: 12ms // SECURE
      </footer>
    </div>
  );
}

export default App;