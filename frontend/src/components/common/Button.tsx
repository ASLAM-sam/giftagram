import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-sans tracking-wide transition-all duration-250 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-400/40 disabled:opacity-50 disabled:cursor-not-allowed select-none font-medium";

  const sizeStyles = {
    sm: "text-xs px-4 py-2 gap-1.5 h-8",
    md: "text-sm px-6 py-2.5 gap-2 h-11",
    lg: "text-base px-8 py-3.5 gap-2.5 h-13",
  };

  const variantStyles = {
    primary: "bg-rose-500 hover:bg-rose-600 text-white shadow-soft hover:shadow-card active:bg-rose-700",
    secondary: "bg-cream-200 hover:bg-cream-300 text-espresso-900 border border-cream-300 hover:border-cream-400",
    outline: "bg-transparent hover:bg-blush-50 text-rose-600 border border-rose-300 hover:border-rose-400",
    ghost: "bg-transparent hover:bg-blush-100/60 text-espresso-800 hover:text-rose-600",
  };

  return (
    <motion.button
      whileHover={disabled || isLoading ? {} : { scale: 1.015 }}
      whileTap={disabled || isLoading ? {} : { scale: 0.985 }}
      transition={{ duration: 0.15 }}
      disabled={disabled || isLoading}
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props as any}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </motion.button>
  );
};
