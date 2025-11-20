import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface DeleteBrandButtonProps {
  brandId: string;
  brandName: string;
  productCount: number;
}

export const DeleteBrandButton = ({ 
  brandId, 
  brandName,
  productCount 
}: DeleteBrandButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [replacementBrandId, setReplacementBrandId] = useState("");
  const queryClient = useQueryClient();

  const { data: allBrands } = useQuery({
    queryKey: ["brands-for-replacement"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("id, name")
        .neq("id", brandId);
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen && productCount > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (productCount > 0 && !replacementBrandId) {
        throw new Error("Please select a replacement brand");
      }

      if (productCount > 0 && replacementBrandId) {
        const { error: updateError } = await supabase
          .from("listings")
          .update({ brand_id: replacementBrandId })
          .eq("brand_id", brandId);

        if (updateError) throw updateError;
      }

      const { error: deleteError } = await supabase
        .from("brands")
        .delete()
        .eq("id", brandId);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      toast.success(`Brand "${brandName}" deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ["brand-stats"] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      queryClient.invalidateQueries({ queryKey: ["search-listings"] });
      setIsOpen(false);
      setReplacementBrandId("");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete brand");
    },
  });

  const handleDeleteWithoutProducts = () => {
    deleteMutation.mutate();
  };

  const handleConfirmWithReplacement = () => {
    if (productCount > 0 && !replacementBrandId) {
      toast.error("Please select a replacement brand");
      return;
    }
    deleteMutation.mutate();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand</AlertDialogTitle>
            <AlertDialogDescription>
              {productCount === 0 ? (
                <>
                  Are you sure you want to delete the brand <strong>"{brandName}"</strong>? 
                  This action cannot be undone.
                </>
              ) : (
                <>
                  The brand <strong>"{brandName}"</strong> has {productCount} product(s) associated with it.
                  Please select a replacement brand for these products before deletion.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {productCount === 0 ? (
            <AlertDialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteWithoutProducts}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogFooter>
          ) : (
            <>
              <div className="py-4">
                <Label htmlFor="replacement-brand">Replacement Brand</Label>
                <Select
                  value={replacementBrandId}
                  onValueChange={setReplacementBrandId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select replacement brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {allBrands
                      ?.filter(brand => brand.id !== brandId)
                      .map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <AlertDialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    setReplacementBrandId("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmWithReplacement}
                  disabled={deleteMutation.isPending || !replacementBrandId}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Replace & Delete"}
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
