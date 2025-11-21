import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Admin {
  id: string;
  admin_code: string;
  name: string;
}

interface Activity {
  id: string;
  action: string;
  details: any;
  created_at: string;
}

interface AdminActivityDialogProps {
  admin: Admin;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdminActivityDialog = ({
  admin,
  open,
  onOpenChange,
}: AdminActivityDialogProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchActivities();
    }
  }, [open, admin.id]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_activity_log")
        .select("*")
        .eq("admin_id", admin.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Activity History - {admin.admin_code}</DialogTitle>
          <DialogDescription>
            Complete activity log for {admin.name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] w-full pr-4">
          {loading ? (
            <div className="text-muted-foreground text-center py-8">Loading activities...</div>
          ) : activities.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">No activities recorded yet</div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="border border-border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2">
                        {activity.action}
                      </Badge>
                      {activity.details && (
                        <pre className="text-sm text-muted-foreground bg-muted p-2 rounded mt-2 overflow-x-auto">
                          {JSON.stringify(activity.details, null, 2)}
                        </pre>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground ml-4">
                      {format(new Date(activity.created_at), "MMM d, yyyy HH:mm")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
