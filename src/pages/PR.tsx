import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteListingButton } from "@/components/DeleteListingButton";
import { toast } from "sonner";
import { useState } from "react";
import { logAdminActivity } from "@/lib/activityLogger";

const PR = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedListings, setSelectedListings] = useState<string[]>([]);

  const { data: listings } = useQuery({
    queryKey: ["pr-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, categories(name)")
        .eq("status", "pr")
        .is("deleted_at", null);
      if (error) throw error;
      return data;
    },
  });

  const markAsListedMutation = useMutation({
    mutationFn: async (listingIds: string[]) => {
      const { error } = await supabase
        .from("listings")
        .update({ status: "published" })
        .in("id", listingIds);
      
      if (error) throw error;

      await logAdminActivity({
        action: "LISTINGS_PUBLISHED",
        section: "pr",
        details: { listing_ids: listingIds, count: listingIds.length }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pr-listings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success(`${selectedListings.length} listing(s) marked as listed`);
      setSelectedListings([]);
    },
    onError: () => {
      toast.error("Failed to mark listings as listed");
    },
  });

  const handleToggleSelection = (listingId: string) => {
    setSelectedListings(prev =>
      prev.includes(listingId)
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  const handleToggleAll = () => {
    if (selectedListings.length === listings?.length) {
      setSelectedListings([]);
    } else {
      setSelectedListings(listings?.map(l => l.id) || []);
    }
  };

  const handleMarkAsListed = () => {
    if (selectedListings.length === 0) {
      toast.error("Please select at least one listing");
      return;
    }
    markAsListedMutation.mutate(selectedListings);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">PR - Passed Review (Ready to Publish)</h1>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            {selectedListings.length > 0 && `${selectedListings.length} selected`}
          </p>
          <Button
            onClick={handleMarkAsListed}
            disabled={selectedListings.length === 0 || markAsListedMutation.isPending}
            className="gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Mark as Listed ({selectedListings.length})
          </Button>
        </div>

        <Card className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedListings.length === listings?.length && listings?.length > 0}
                    onCheckedChange={handleToggleAll}
                  />
                </TableHead>
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
                  <TableCell>
                    <Checkbox
                      checked={selectedListings.includes(listing.id)}
                      onCheckedChange={() => handleToggleSelection(listing.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{listing.product_name}</TableCell>
                  <TableCell>{listing.title}</TableCell>
                  <TableCell className="max-w-xs truncate">{listing.description}</TableCell>
                  <TableCell>{listing.categories?.name}</TableCell>
                  <TableCell><StatusBadge status={listing.status} /></TableCell>
                  <TableCell>
                    <DeleteListingButton listingId={listing.id} queryKey={["pr-listings"]} />
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

export default PR;
