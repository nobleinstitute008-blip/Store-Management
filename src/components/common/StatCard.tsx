import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'emerald' | 'indigo' | 'amber' | 'rose' | 'sky' | 'slate';
  badge?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'indigo',
  badge,
  onClick
}) => {
  const variantStyles = {
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
      accent: 'text-emerald-600'
    },
    indigo: {
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
      accent: 'text-indigo-600'
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200/80',
      accent: 'text-amber-600'
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200/80',
      accent: 'text-rose-600'
    },
    sky: {
      iconBg: 'bg-sky-50 text-sky-600 border-sky-200/80',
      accent: 'text-sky-600'
    },
    slate: {
      iconBg: 'bg-slate-100 text-slate-600 border-slate-200',
      accent: 'text-slate-700'
    }
  }[variant];

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs transition-all ${
        onClick ? 'cursor-pointer hover:border-indigo-400 hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</span>
            {badge && (
              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                {badge}
              </span>
            )}
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 truncate">{value}</div>
          {subtitle && <div className="text-xs text-slate-500 font-medium mt-0.5 truncate">{subtitle}</div>}
          {trend && (
            <div className={`text-xs font-bold mt-1.5 flex items-center gap-1 ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-lg border shrink-0 ${variantStyles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

