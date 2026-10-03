import React from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';

interface LargeCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  actionText?: string;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  highlightAction?: boolean;
}

export const LargeCard: React.FC<LargeCardProps> = ({
  title,
  subtitle,
  description,
  icon,
  badge,
  badgeColor = 'bg-amber-100 text-amber-900 border-amber-300',
  actionText,
  onClick,
  className = '',
  children,
  highlightAction = true,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border-2 border-slate-900 rounded-3xl p-5 md:p-6 shadow-card-solid transition-all ${
        onClick ? 'cursor-pointer hover:shadow-card-solid-hover active:translate-y-1' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left icon and content */}
        <div className="flex items-start gap-4 flex-1">
          {icon && (
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-amber-50 border-2 border-slate-900 flex items-center justify-center shrink-0 text-slate-900 shadow-sm">
              {icon}
            </div>
          )}
          <div className="flex-1 space-y-1">
            {badge && (
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border mb-1 ${badgeColor}`}
              >
                {badge}
              </span>
            )}
            <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm md:text-base font-bold text-teal-700">
                {subtitle}
              </p>
            )}
            {description && (
              <p className="text-sm md:text-base text-slate-600 font-medium pt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right Action Button (Yellow circular/pill arrow button) */}
        {actionText ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onClick) onClick();
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 border-2 border-slate-900 text-slate-950 font-extrabold text-base shadow-btn-solid active:translate-y-0.5 shrink-0"
          >
            <span>{actionText}</span>
            <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
          </button>
        ) : onClick ? (
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-amber-400 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-btn-solid shrink-0 group-hover:bg-amber-300">
            <ChevronRight className="w-6 h-6 md:w-7 md:h-7" strokeWidth={3} />
          </div>
        ) : null}
      </div>

      {children && <div className="mt-4 pt-4 border-t-2 border-slate-100">{children}</div>}
    </div>
  );
};
