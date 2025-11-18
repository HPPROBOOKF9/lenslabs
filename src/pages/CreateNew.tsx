import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, FolderPlus } from "lucide-react";
import { z } from "zod";

const listingSchema = z.object({
  product_name: z.string()
    .trim()
    .min(1, "Product name is required")
    .max(200, "Product name must be less than 200 characters"),
  category_id: z.string().uuid("Invalid category selected")
});

const categorySchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Category name is required")
    .max(100, "Category name must be less than 100 characters")
});

const CreateNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<"listing" | "category" | null>(null);
  const [productName, setProductName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) throw error;
      return data;
    },
  });

  const handleCreateListing = async () => {
    try {
      const validated = listingSchema.parse({
        product_name: productName,
        category_id: categoryId
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Authentication error", variant: "destructive" });
        return;
      }

      const { error } = await supabase.from("listings").insert({
        product_name: validated.product_name,
        category_id: validated.category_id,
        status: "cpv",
        created_by: user.id,
      });

      if (error) {
        toast({ title: "Error creating listing", variant: "destructive" });
        return;
      }

      toast({ title: "Listing created and moved to CPV" });
      navigate("/cpv");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: error.errors[0].message, variant: "destructive" });
      }
    }
  };

  const handleCreateCategory = async () => {
    try {
      const validated = categorySchema.parse({
        name: newCategoryName
      });

      const { error } = await supabase.from("categories").insert({
        name: validated.name,
      });

      if (error) {
        toast({ title: "Error creating category", variant: "destructive" });
        return;
      }

      toast({ title: "Category created successfully" });
      setNewCategoryName("");
      setMode(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: error.errors[0].message, variant: "destructive" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">Create New</h1>
        </div>

        {!mode && (
          <div className="grid grid-cols-2 gap-4">
            <Card
              className="p-8 flex flex-col items-center justify-center gap-4 hover:bg-accent transition-colors cursor-pointer"
              onClick={() => setMode("listing")}
            >
              <Plus className="w-16 h-16 text-primary" strokeWidth={1.5} />
              <div className="text-lg font-medium text-center">Create New Listing</div>
            </Card>
            <Card
              className="p-8 flex flex-col items-center justify-center gap-4 hover:bg-accent transition-colors cursor-pointer"
              onClick={() => setMode("category")}
            >
              <FolderPlus className="w-16 h-16 text-primary" strokeWidth={1.5} />
              <div className="text-lg font-medium text-center">Create New Category</div>
            </Card>
          </div>
        )}

        {mode === "listing" && (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Create New Listing</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateListing} className="flex-1">
                  Create Listing
                </Button>
                <Button variant="outline" onClick={() => setMode(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {mode === "category" && (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Create New Category</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="categoryName">Category Name</Label>
                <Input
                  id="categoryName"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateCategory} className="flex-1">
                  Create Category
                </Button>
                <Button variant="outline" onClick={() => setMode(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CreateNew;
