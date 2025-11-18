import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

const statusColors: Record<string, string> = {
  cpv: "bg-warning text-warning-foreground",
  assign: "bg-accent text-accent-foreground",
  worklist: "bg-primary text-primary-foreground",
  nr: "bg-warning text-warning-foreground",
  np: "bg-destructive text-destructive-foreground",
  pr: "bg-success text-success-foreground",
  published: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  cpv: "CPV",
  assign: "Assign",
  worklist: "Worklist",
  nr: "NR",
  np: "NP",
  pr: "PR",
  published: "Published",
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <Badge className={cn("font-medium", statusColors[status] || "")}>
      {statusLabels[status] || status.toUpperCase()}
    </Badge>
  );
};
