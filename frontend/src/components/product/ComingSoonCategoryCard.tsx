import React from 'react';
import { motion } from 'framer-motion';
import { ComingSoonCategory } from '../../types';
import { Sparkles, BellRing, Lock } from 'lucide-react';
import { useUI } from '../../context/UIContext';

interface ComingSoonCategoryCardProps {
  category: ComingSoonCategory;
}

export const ComingSoonCategoryCard: React.FC<ComingSoonCategoryCardProps> = ({ category }) => {
  const { showToast } = useUI();

  const handleNotifyMe = (e: React.MouseEvent) => {
    e.preventDefault();
    showToast(`You'll be the first to know when ${category.title} launches!`, 'success');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
      className="relative bg-gradient-to-b from-[#FFFDF9] to-cream-50 rounded-luxury p-6 border border-cream-300/80 shadow-soft flex flex-col justify-between group hover:border-rose-300/80 transition-all duration-300"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="inline-flex items-center gap-1 bg-blush-100/90 text-rose-600 text-[0.68rem] font-medium tracking-wider uppercase px-2.5 py-1 rounded-full border border-rose-200/60">
            <Sparkles className="w-3 h-3" />
            {category.badge}
          </span>
          <span className="text-[0.65rem] text-espresso-600/70 font-sans tracking-widest uppercase flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Not for sale yet
          </span>
        </div>

        {/* Category Title & Subtitle */}
        <h3 className="font-serif text-xl font-medium text-espresso-900 group-hover:text-rose-600 transition-colors">
          {category.title}
        </h3>
        <p className="font-serif italic text-xs text-rose-600 mt-1 mb-2.5">
          {category.subtitle}
        </p>
        <p className="text-xs text-espresso-700 leading-relaxed">
          {category.description}
        </p>
      </div>

      {/* Disabled Action Bar with Notify Option */}
      <div className="pt-6 mt-5 border-t border-cream-200 flex items-center justify-between gap-3">
        <button
          disabled
          className="text-xs font-medium text-espresso-600/50 bg-cream-200/70 cursor-not-allowed px-3.5 py-2 rounded-full select-none"
        >
          Currently Unavailable
        </button>

        <button
          onClick={handleNotifyMe}
          className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline underline-offset-4 py-1.5 transition-colors"
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>Notify Me</span>
        </button>
      </div>
    </motion.div>
  );
};
