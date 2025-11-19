import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
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

interface DeleteListingButtonProps {
  listingId: string;
  queryKey: string[];
}

export const DeleteListingButton = ({ listingId, queryKey }: DeleteListingButtonProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("listings")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", listingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Listing moved to deleted listings" });
      queryClient.invalidateQueries({ queryKey });
      setShowDialog(false);
    },
    onError: () => {
      toast({ title: "Error deleting listing", variant: "destructive" });
    },
  });

  return (
    <>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => setShowDialog(true)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the listing to deleted listings. You can restore it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
