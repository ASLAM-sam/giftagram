import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'weight' | 'coming-soon' | 'category' | 'notice' | 'accent';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'category',
  className = '',
}) => {
  const styles = {
    weight: "bg-cream-100 text-espresso-800 border border-cream-300/80 px-2.5 py-0.5 text-[0.72rem] font-medium tracking-wider rounded-md uppercase",
    'coming-soon': "bg-blush-100 text-mauve-600 border border-rose-200/70 px-3 py-1 text-[0.7rem] font-semibold tracking-widest uppercase rounded-full",
    category: "bg-blush-50 text-rose-600 border border-rose-200/50 px-2.5 py-0.5 text-xs font-medium rounded-full",
    notice: "bg-champagne-100 text-espresso-700 border border-champagne-200 px-2.5 py-1 text-[0.75rem] font-medium rounded-md",
    accent: "bg-rose-500 text-white px-2.5 py-0.5 text-[0.7rem] font-medium tracking-wider uppercase rounded-full",
  };

  return (
    <span className={`inline-flex items-center gap-1 font-sans ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};
