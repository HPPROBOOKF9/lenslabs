import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteListingButton } from "@/components/DeleteListingButton";

const Assign = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [assignedAdminId, setAssignedAdminId] = useState("");

  const { data: listings } = useQuery({
    queryKey: ["assign-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, categories(name)")
        .eq("status", "assign")
        .is("deleted_at", null);
      if (error) throw error;
      return data;
    },
  });

  const { data: admins } = useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admins").select("*");
      if (error) throw error;
      return data;
    },
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("listings")
        .update({
          assigned_to: assignedAdminId,
          status: "worklist",
        })
        .eq("id", selectedListing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Listing assigned to admin's worklist" });
      queryClient.invalidateQueries({ queryKey: ["assign-listings"] });
      setSelectedListing(null);
      setAssignedAdminId("");
    },
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">Assign to Admin</h1>
        </div>

        <Card className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings?.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell className="font-medium">{listing.product_name}</TableCell>
                  <TableCell>{listing.title}</TableCell>
                  <TableCell>{listing.categories?.name}</TableCell>
                  <TableCell><StatusBadge status={listing.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setSelectedListing(listing)}>
                        Assign
                      </Button>
                      <DeleteListingButton listingId={listing.id} queryKey={["assign-listings"]} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={!!selectedListing} onOpenChange={() => setSelectedListing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign to Admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Select value={assignedAdminId} onValueChange={setAssignedAdminId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select admin" />
                  </SelectTrigger>
                  <SelectContent>
                    {admins?.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.admin_code} - {admin.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => assignMutation.mutate()} className="w-full">
                Assign to Worklist
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Assign;
