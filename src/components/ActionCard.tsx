import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface ActionCardProps {
  icon: LucideIcon;
  label: string;
  to: string;
}

export const ActionCard = ({ icon: Icon, label, to }: ActionCardProps) => {
  return (
    <Link to={to}>
      <Card className="p-8 flex flex-col items-center justify-center gap-4 hover:bg-accent transition-colors cursor-pointer group h-40">
        <Icon className="w-12 h-12 text-primary group-hover:scale-110 transition-transform" strokeWidth={1.5} />
        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide text-center">
          {label}
        </div>
      </Card>
    </Link>
  );
};
