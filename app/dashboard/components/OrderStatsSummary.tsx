import { ShoppingCart, Clock, CheckCircle, Rocket } from 'lucide-react';
import { StatsCard } from './StatsCard';

export interface OrderStats {
  totalOrders: number;
  pending: number;
  inTransit: number;
  completed: number;
}

interface OrderStatsSummaryProps {
  stats: OrderStats;
}

export function OrderStatsSummary({ stats }: OrderStatsSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatsCard
        title="Total Orders"
        value={stats.totalOrders.toLocaleString()}
        icon={ShoppingCart}
      />
      <StatsCard
        title="Pending"
        value={stats.pending.toString()}
        icon={Clock}
      />
      <StatsCard
        title="In Transit"
        value={stats.inTransit.toString()}
        icon={Rocket}
      />
      <StatsCard
        title="Completed"
        value={stats.completed.toString()}
        icon={CheckCircle}
      />
    </div>
  );
}
