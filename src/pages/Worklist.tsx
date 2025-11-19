import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteListingButton } from "@/components/DeleteListingButton";

const Worklist = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: listings } = useQuery({
    queryKey: ["worklist-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          categories(name)
        `)
        .eq("status", "worklist")
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

  const submitMutation = useMutation({
    mutationFn: async (listingId: string) => {
      const { error } = await supabase
        .from("listings")
        .update({ status: "nr" })
        .eq("id", listingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Listing submitted to NR for review" });
      queryClient.invalidateQueries({ queryKey: ["worklist-listings"] });
    },
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">Work List</h1>
        </div>

        <Card className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings?.map((listing) => {
                const assignedAdmin = admins?.find(a => a.id === listing.assigned_to);
                return (
                  <TableRow key={listing.id}>
                    <TableCell className="font-medium">{listing.product_name}</TableCell>
                    <TableCell>{listing.title}</TableCell>
                    <TableCell>{listing.categories?.name}</TableCell>
                    <TableCell>{assignedAdmin?.admin_code || "Unassigned"}</TableCell>
                    <TableCell><StatusBadge status={listing.status} /></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => submitMutation.mutate(listing.id)}>
                          Complete & Submit
                        </Button>
                        <DeleteListingButton listingId={listing.id} queryKey={["worklist-listings"]} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default Worklist;
