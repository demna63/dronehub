import React from 'react';
import OptimizedImage from './OptimizedImage';

interface LogoProps {
  className?: string;
  iconOnly?: boolean; 
}

const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <div className={`relative group flex items-center justify-center ${className}`}>
      <div className="absolute -inset-2 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative h-10 w-36 bg-gradient-to-br from-slate-800 to-slate-950 border border-white/10 group-hover:border-sky-500/30 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-sky-500/10">
        <OptimizedImage
          avifSrc="/logo.avif"
          webpSrc="/logo.webp"
          fallbackSrc="/logo.webp"
          alt="DroneHub Logo"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
};

export default Logo;