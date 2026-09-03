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

      <div className="relative h-10 w-36 bg-white border border-white/20 group-hover:border-sky-400/40 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-sky-500/20">
        <OptimizedImage
          avifSrc="/brand/dhg-logo.avif"
          webpSrc="/brand/dhg-logo.webp"
          fallbackSrc="/brand/dhg-logo.png"
          alt="DroneHub Georgia DHG"
          width={144}
          height={40}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="w-full h-full object-contain p-1 transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    </div>
  );
};

export default Logo;