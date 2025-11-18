import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminCardProps {
  adminCode: string;
  pendingCount: number;
  isActive?: boolean;
}

export const AdminCard = ({ adminCode, pendingCount, isActive }: AdminCardProps) => {
  return (
    <Card
      className={cn(
        "p-4 text-center cursor-pointer transition-all hover:shadow-md",
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "bg-card hover:bg-accent"
      )}
    >
      <div className={cn(
        "text-sm font-medium mb-1",
        isActive ? "text-primary-foreground" : "text-muted-foreground"
      )}>
        {adminCode}
      </div>
      <div className="text-2xl font-bold">
        {pendingCount}
      </div>
    </Card>
  );
};
