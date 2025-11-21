import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Lock, Unlock, Trash2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminActivityDialog } from "./AdminActivityDialog";
import { AdminPermissionsDialog } from "./AdminPermissionsDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Admin {
  id: string;
  admin_code: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
}

export const AdminList = () => {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from("admins")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching admins",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleToggleStatus = async (admin: Admin) => {
    const newStatus = admin.status === "active" ? "frozen" : "active";

    try {
      const { error } = await supabase
        .from("admins")
        .update({ status: newStatus })
        .eq("id", admin.id);

      if (error) throw error;

      toast({
        title: `Admin ${newStatus === "frozen" ? "frozen" : "activated"}`,
        description: `${admin.admin_code} is now ${newStatus}.`,
      });

      fetchAdmins();
    } catch (error: any) {
      toast({
        title: "Error updating admin status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;

    try {
      const { error } = await supabase
        .from("admins")
        .delete()
        .eq("id", adminToDelete.id);

      if (error) throw error;

      toast({
        title: "Admin removed",
        description: `${adminToDelete.admin_code} has been removed.`,
      });

      fetchAdmins();
      setDeleteDialogOpen(false);
      setAdminToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error removing admin",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openActivityDialog = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowActivityDialog(true);
  };

  const openPermissionsDialog = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowPermissionsDialog(true);
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading admins...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Admin Management</CardTitle>
          <CardDescription>
            View and manage all admin accounts, their permissions, and activity history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.admin_code}</TableCell>
                  <TableCell>{admin.name}</TableCell>
                  <TableCell>{admin.email || "N/A"}</TableCell>
                  <TableCell>{admin.phone || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant={admin.status === "active" ? "default" : "secondary"}>
                      {admin.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openActivityDialog(admin)}
                        title="View Activity History"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openPermissionsDialog(admin)}
                        title="Manage Permissions"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(admin)}
                        title={admin.status === "active" ? "Freeze Account" : "Activate Account"}
                      >
                        {admin.status === "active" ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Unlock className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setAdminToDelete(admin);
                          setDeleteDialogOpen(true);
                        }}
                        title="Remove Admin"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedAdmin && (
        <>
          <AdminActivityDialog
            admin={selectedAdmin}
            open={showActivityDialog}
            onOpenChange={setShowActivityDialog}
          />
          <AdminPermissionsDialog
            admin={selectedAdmin}
            open={showPermissionsDialog}
            onOpenChange={setShowPermissionsDialog}
          />
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {adminToDelete?.admin_code}? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAdmin} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
