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

interface DeleteCategoryButtonProps {
  categoryId: string;
  categoryName: string;
  productCount: number;
}

export const DeleteCategoryButton = ({ 
  categoryId, 
  categoryName,
  productCount 
}: DeleteCategoryButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [replacementCategoryId, setReplacementCategoryId] = useState("");
  const queryClient = useQueryClient();

  const { data: allCategories } = useQuery({
    queryKey: ["categories-for-replacement"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .neq("id", categoryId);
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen && productCount > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (productCount > 0 && !replacementCategoryId) {
        throw new Error("Please select a replacement category");
      }

      if (productCount > 0 && replacementCategoryId) {
        const { error: updateError } = await supabase
          .from("listings")
          .update({ category_id: replacementCategoryId })
          .eq("category_id", categoryId);

        if (updateError) throw updateError;
      }

      const { error: deleteError } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      toast.success(`Category "${categoryName}" deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ["category-stats"] });
      queryClient.invalidateQueries({ queryKey: ["subcategory-stats"] });
      queryClient.invalidateQueries({ queryKey: ["search-listings"] });
      setIsOpen(false);
      setReplacementCategoryId("");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete category: ${error.message}`);
    },
  });

  const handleDelete = () => {
    if (productCount === 0) {
      deleteMutation.mutate();
    } else {
      setIsOpen(true);
    }
  };

  const handleConfirmWithReplacement = () => {
    if (!replacementCategoryId && productCount > 0) {
      toast.error("Please select a replacement category");
      return;
    }
    deleteMutation.mutate();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={deleteMutation.isPending}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace Category Before Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              This category "{categoryName}" is used by {productCount} product(s). 
              Please select a replacement category to reassign these products before deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Replacement Category</Label>
              <Select 
                value={replacementCategoryId} 
                onValueChange={setReplacementCategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select replacement category" />
                </SelectTrigger>
                <SelectContent>
                  {allCategories
                    ?.filter(cat => cat.id !== categoryId)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setReplacementCategoryId("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmWithReplacement}
              disabled={deleteMutation.isPending || !replacementCategoryId}
            >
              {deleteMutation.isPending ? "Deleting..." : "Replace & Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
