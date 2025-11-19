import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteListingButton } from "@/components/DeleteListingButton";
import { z } from "zod";

const listingDetailsSchema = z.object({
  title: z.string()
    .trim()
    .min(1, "Title is required")
    .max(300, "Title must be less than 300 characters"),
  description: z.string()
    .trim()
    .max(5000, "Description must be less than 5000 characters")
    .optional()
});

const CPV = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data: listings } = useQuery({
    queryKey: ["cpv-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, categories(name)")
        .eq("status", "cpv")
        .is("deleted_at", null);
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const validated = listingDetailsSchema.parse({
        title,
        description: description || undefined
      });

      const { error } = await supabase
        .from("listings")
        .update({
          title: validated.title,
          description: validated.description,
          status: "assign",
        })
        .eq("id", selectedListing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Listing updated and moved to Assign" });
      queryClient.invalidateQueries({ queryKey: ["cpv-listings"] });
      setSelectedListing(null);
      setTitle("");
      setDescription("");
    },
    onError: (error) => {
      if (error instanceof z.ZodError) {
        toast({ title: error.errors[0].message, variant: "destructive" });
      } else {
        toast({ title: "Error updating listing", variant: "destructive" });
      }
    },
  });

  const handleEdit = (listing: any) => {
    setSelectedListing(listing);
    setTitle(listing.title || "");
    setDescription(listing.description || "");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">CPV - Created Pending Validation</h1>
        </div>

        <Card className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings?.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell className="font-medium">{listing.product_name}</TableCell>
                  <TableCell>{listing.categories?.name}</TableCell>
                  <TableCell><StatusBadge status={listing.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleEdit(listing)}>
                        Add Details
                      </Button>
                      <DeleteListingButton listingId={listing.id} queryKey={["cpv-listings"]} />
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
              <DialogTitle>Add Listing Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={4}
                />
              </div>
              <Button onClick={() => updateMutation.mutate()} className="w-full">
                Submit to Assign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CPV;
