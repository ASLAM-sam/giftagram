import React from 'react';
import { Link } from 'react-router-dom';
import { BRAND_CONFIG } from '../../config/brand';

interface LogoProps {
  className?: string;
  isFooter?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', isFooter: _isFooter = false }) => {
  const { logo, name } = BRAND_CONFIG;

  if (logo.useImageLogo) {
    return (
      <Link to="/" className={`inline-flex items-center group ${className}`}>
        <img
          src={logo.imagePath}
          alt={logo.altText}
          className={`${logo.width.desktop} object-contain transition-transform duration-300 group-hover:scale-105`}
        />
      </Link>
    );
  }

  // Ultra-clean, premium typography mark placeholder
  return (
    <Link to="/" className={`inline-flex flex-col items-start group select-none ${className}`}>
      <span className="font-serif text-xl sm:text-2xl md:text-[1.65rem] tracking-[0.14em] sm:tracking-[0.18em] text-espresso-900 font-medium uppercase group-hover:text-rose-600 transition-colors duration-300">
        {name}
      </span>
      <span className="font-sans text-[0.6rem] sm:text-[0.65rem] tracking-[0.2em] sm:tracking-[0.25em] text-rose-500 uppercase -mt-0.5 font-medium pl-0.5">
        Gifting & Bakery Studio
      </span>
    </Link>
  );
};
