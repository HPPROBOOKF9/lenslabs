import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface Admin {
  id: string;
  admin_code: string;
  name: string;
}

interface Permission {
  section: string;
  can_access: boolean;
}

interface AdminPermissionsDialogProps {
  admin: Admin;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AVAILABLE_SECTIONS = [
  "Dashboard",
  "Create New",
  "Worklist",
  "Assign",
  "CPV",
  "NR",
  "NP",
  "PR",
  "Draft",
  "Deleted Listings",
  "Data Block",
  "Trend Analysis",
  "Admin Privileges",
];

export const AdminPermissionsDialog = ({
  admin,
  open,
  onOpenChange,
}: AdminPermissionsDialogProps) => {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPermissions();
    }
  }, [open, admin.id]);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_permissions")
        .select("*")
        .eq("admin_id", admin.id);

      if (error) throw error;

      const permissionsMap: Record<string, boolean> = {};
      AVAILABLE_SECTIONS.forEach((section) => {
        const permission = data?.find((p) => p.section === section);
        permissionsMap[section] = permission?.can_access ?? true;
      });

      setPermissions(permissionsMap);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      // Delete existing permissions
      await supabase.from("admin_permissions").delete().eq("admin_id", admin.id);

      // Insert new permissions
      const permissionsToInsert = Object.entries(permissions).map(
        ([section, can_access]) => ({
          admin_id: admin.id,
          section,
          can_access,
        })
      );

      const { error } = await supabase
        .from("admin_permissions")
        .insert(permissionsToInsert);

      if (error) throw error;

      toast({
        title: "Permissions updated",
        description: `Permissions for ${admin.admin_code} have been updated.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error updating permissions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (section: string) => {
    setPermissions((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Permissions - {admin.admin_code}</DialogTitle>
          <DialogDescription>
            Control which sections {admin.name} can access
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-muted-foreground text-center py-8">Loading permissions...</div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              {AVAILABLE_SECTIONS.map((section) => (
                <div key={section} className="flex items-center justify-between py-2">
                  <Label htmlFor={section} className="cursor-pointer">
                    {section}
                  </Label>
                  <Switch
                    id={section}
                    checked={permissions[section]}
                    onCheckedChange={() => togglePermission(section)}
                  />
                </div>
              ))}
            </div>

            <Button
              onClick={handleSavePermissions}
              disabled={saving}
              className="w-full"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Permissions"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
