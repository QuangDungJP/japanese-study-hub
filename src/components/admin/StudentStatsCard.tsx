import { LucideIcon } from 'lucide-react';

interface StudentStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color: 'primary' | 'success' | 'warning' | 'accent';
}

const colorClasses = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-green-500/10 text-green-600',
  warning: 'bg-orange-500/10 text-orange-600',
  accent: 'bg-accent/10 text-accent',
};

const StudentStatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp,
  color 
}: StudentStatsCardProps) => {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 flex items-center gap-1 ${
              trendUp ? 'text-green-600' : 'text-red-500'
            }`}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </div>
  );
};

export default StudentStatsCard;
