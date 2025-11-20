import React from 'react';
import { Terminal, ShieldAlert, Zap } from 'lucide-react';

interface PanelProps {
  children: React.ReactNode;
  title: string;
  className?: string;
  icon?: React.ReactNode;
  glowing?: boolean;
}

export const CyberPanel: React.FC<PanelProps> = ({ children, title, className = '', icon, glowing = false }) => {
  return (
    <div className={`relative border-2 bg-cyber-dark/80 backdrop-blur-sm overflow-hidden ${
      glowing ? 'border-cyber-neonPink shadow-[0_0_15px_rgba(255,0,255,0.3)]' : 'border-cyber-neonBlue/50'
    } ${className}`}>
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-2 h-2 bg-cyber-neonBlue"></div>
      <div className="absolute top-0 right-0 w-2 h-2 bg-cyber-neonBlue"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 bg-cyber-neonBlue"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 bg-cyber-neonBlue"></div>

      {/* Header */}
      <div className="bg-cyber-neonBlue/10 p-2 flex items-center border-b border-cyber-neonBlue/30">
        {icon || <Terminal size={16} className="text-cyber-neonBlue mr-2" />}
        <h3 className="font-display font-bold text-cyber-neonBlue tracking-widest uppercase text-sm">
          {title}
        </h3>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger';
}

export const CyberButton: React.FC<CyberButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = "relative px-6 py-3 font-display font-bold uppercase tracking-widest transition-all duration-200 clip-path-polygon hover:translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-cyber-neonBlue/10 text-cyber-neonBlue border border-cyber-neonBlue hover:bg-cyber-neonBlue hover:text-cyber-black shadow-[0_0_10px_rgba(0,243,255,0.2)] hover:shadow-[0_0_20px_rgba(0,243,255,0.6)]",
    danger: "bg-cyber-neonPink/10 text-cyber-neonPink border border-cyber-neonPink hover:bg-cyber-neonPink hover:text-cyber-black shadow-[0_0_10px_rgba(255,0,255,0.2)] hover:shadow-[0_0_20px_rgba(255,0,255,0.6)]"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const ScanlineOverlay: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden h-full w-full">
    {/* Scanline moving bar */}
    <div className="w-full h-[2px] bg-cyber-neonBlue/20 absolute top-0 animate-scanline shadow-[0_0_10px_rgba(0,243,255,0.5)]"></div>
    {/* Static noise overlay */}
    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
    {/* Vignette */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(2,6,23,0.8)_100%)]"></div>
  </div>
);