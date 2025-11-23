import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteListingButton } from "@/components/DeleteListingButton";
import { logAdminActivity } from "@/lib/activityLogger";

const NR = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: listings } = useQuery({
    queryKey: ["nr-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, categories(name)")
        .eq("status", "nr")
        .is("deleted_at", null);
      if (error) throw error;
      return data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ listingId, newStatus }: { listingId: string; newStatus: "pr" | "np" }) => {
      const { error } = await supabase
        .from("listings")
        .update({ status: newStatus })
        .eq("id", listingId);
      if (error) throw error;

      await logAdminActivity({
        action: newStatus === "pr" ? "LISTING_PASSED" : "LISTING_REJECTED",
        section: "nr",
        details: { listing_id: listingId, new_status: newStatus }
      });
    },
    onSuccess: (_, variables) => {
      const message = variables.newStatus === "pr" 
        ? "Listing passed review" 
        : "Listing rejected, moved to NP";
      toast({ title: message });
      queryClient.invalidateQueries({ queryKey: ["nr-listings"] });
    },
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">NR - Needs Review</h1>
        </div>

        <Card className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
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
                  <TableCell className="max-w-xs truncate">{listing.description}</TableCell>
                  <TableCell>{listing.categories?.name}</TableCell>
                  <TableCell><StatusBadge status={listing.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => reviewMutation.mutate({ listingId: listing.id, newStatus: "pr" })}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Pass
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => reviewMutation.mutate({ listingId: listing.id, newStatus: "np" })}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <DeleteListingButton listingId={listing.id} queryKey={["nr-listings"]} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default NR;
