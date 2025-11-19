import { Card } from "@/components/ui/card";
interface StatCardProps {
  label: string;
  value: number;
  sublabel?: string;
}
export const StatCard = ({
  label,
  value,
  sublabel
}: StatCardProps) => {
  return <div className="flex flex-col items-center">
      <div className="text-4xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
      {sublabel}
    </div>;
};