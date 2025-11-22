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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  section: string | null;
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
  const [selectedSection, setSelectedSection] = useState<string>("all");

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
        .limit(500);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { value: "all", label: "All Activities" },
    { value: "create_listing", label: "Create Listing" },
    { value: "assign", label: "Assign" },
    { value: "pr", label: "PR (Passed Review)" },
    { value: "nr", label: "NR (Needs Review)" },
    { value: "np", label: "NP (Not Passed)" },
    { value: "clicks", label: "Clicks" },
  ];

  const filteredActivities = selectedSection === "all" 
    ? activities 
    : activities.filter(activity => activity.section === selectedSection);

  const renderActivityItem = (activity: Activity) => (
    <div
      key={activity.id}
      className="border border-border rounded-lg p-4 space-y-2"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">
              {activity.action}
            </Badge>
            {activity.section && (
              <Badge variant="secondary">
                {sections.find(s => s.value === activity.section)?.label || activity.section}
              </Badge>
            )}
          </div>
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
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Activity History - {admin.admin_code}</DialogTitle>
          <DialogDescription>
            Complete activity log for {admin.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedSection} onValueChange={setSelectedSection} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            {sections.map((section) => (
              <TabsTrigger key={section.value} value={section.value}>
                {section.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {sections.map((section) => (
            <TabsContent key={section.value} value={section.value}>
              <ScrollArea className="h-[500px] w-full pr-4">
                {loading ? (
                  <div className="text-muted-foreground text-center py-8">Loading activities...</div>
                ) : filteredActivities.length === 0 ? (
                  <div className="text-muted-foreground text-center py-8">
                    No activities recorded for this section yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredActivities.map(renderActivityItem)}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
