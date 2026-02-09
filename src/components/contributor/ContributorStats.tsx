import { Card, CardContent } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

interface StatsProps {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export function ContributorStats({ total, pending, approved, rejected }: StatsProps) {
  const stats = [
    { label: 'Total Uploads', value: total, icon: FileText, color: 'text-primary' },
    { label: 'Pending', value: pending, icon: Clock, color: 'text-yellow-600' },
    { label: 'Approved', value: approved, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Rejected', value: rejected, icon: XCircle, color: 'text-red-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-background ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}