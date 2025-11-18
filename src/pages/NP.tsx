import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

const NP = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: listings } = useQuery({
    queryKey: ["np-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, categories(name)")
        .eq("status", "np");
      if (error) throw error;
      return data;
    },
  });

  const resubmitMutation = useMutation({
    mutationFn: async (listingId: string) => {
      const { error } = await supabase
        .from("listings")
        .update({ status: "nr" })
        .eq("id", listingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Listing resubmitted to NR for review" });
      queryClient.invalidateQueries({ queryKey: ["np-listings"] });
    },
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">NP - Not Passed</h1>
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
                    <Button size="sm" onClick={() => resubmitMutation.mutate(listing.id)}>
                      Resubmit to NR
                    </Button>
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

export default NP;
