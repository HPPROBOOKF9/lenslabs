import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, FolderPlus, List, FolderTree } from "lucide-react";
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
    .max(100, "Category name must be less than 100 characters"),
  parent_id: z.string().uuid().optional().nullable()
});

const bulkListingSchema = z.object({
  bulk_text: z.string()
    .trim()
    .min(1, "Please enter at least one product name"),
  category_id: z.string().uuid("Invalid category selected")
});

const CreateNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"listing" | "category" | "subcategory" | "bulk" | null>(null);
  const [productName, setProductName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const parentCategories = categories?.filter(cat => !cat.parent_id) || [];
  const subCategories = categories?.filter(cat => cat.parent_id) || [];

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
        name: newCategoryName,
        parent_id: null
      });

      const { error } = await supabase.from("categories").insert({
        name: validated.name,
        parent_id: null,
      });

      if (error) {
        toast({ title: "Error creating category", variant: "destructive" });
        return;
      }

      toast({ title: "Category created successfully" });
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      setNewCategoryName("");
      setMode(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: error.errors[0].message, variant: "destructive" });
      }
    }
  };

  const handleCreateSubCategory = async () => {
    try {
      const validated = categorySchema.parse({
        name: subCategoryName,
        parent_id: parentCategoryId
      });

      const { error } = await supabase.from("categories").insert({
        name: validated.name,
        parent_id: validated.parent_id,
      });

      if (error) {
        toast({ title: "Error creating subcategory", variant: "destructive" });
        return;
      }

      toast({ title: "Subcategory created successfully" });
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      setSubCategoryName("");
      setParentCategoryId("");
      setMode(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: error.errors[0].message, variant: "destructive" });
      }
    }
  };

  const handleCreateBulkListings = async () => {
    try {
      const validated = bulkListingSchema.parse({
        bulk_text: bulkText,
        category_id: bulkCategoryId
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Authentication error", variant: "destructive" });
        return;
      }

      const productNames = validated.bulk_text
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);

      if (productNames.length === 0) {
        toast({ title: "No valid product names found", variant: "destructive" });
        return;
      }

      const listings = productNames.map(name => ({
        product_name: name,
        category_id: validated.category_id,
        status: "cpv" as const,
        created_by: user.id,
      }));

      const { error } = await supabase.from("listings").insert(listings);

      if (error) {
        toast({ title: "Error creating listings", variant: "destructive" });
        return;
      }

      toast({ title: `${productNames.length} listings created and moved to CPV` });
      navigate("/cpv");
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
              onClick={() => setMode("bulk")}
            >
              <List className="w-16 h-16 text-primary" strokeWidth={1.5} />
              <div className="text-lg font-medium text-center">Bulk Create Listings</div>
            </Card>
            <Card
              className="p-8 flex flex-col items-center justify-center gap-4 hover:bg-accent transition-colors cursor-pointer"
              onClick={() => setMode("category")}
            >
              <FolderPlus className="w-16 h-16 text-primary" strokeWidth={1.5} />
              <div className="text-lg font-medium text-center">Create New Category</div>
            </Card>
            <Card
              className="p-8 flex flex-col items-center justify-center gap-4 hover:bg-accent transition-colors cursor-pointer"
              onClick={() => setMode("subcategory")}
            >
              <FolderTree className="w-16 h-16 text-primary" strokeWidth={1.5} />
              <div className="text-lg font-medium text-center">Create Subcategory</div>
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
                    {parentCategories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                    {subCategories?.map((cat) => {
                      const parent = categories?.find(c => c.id === cat.parent_id);
                      return (
                        <SelectItem key={cat.id} value={cat.id}>
                          {parent?.name} → {cat.name}
                        </SelectItem>
                      );
                    })}
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

        {mode === "bulk" && (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Bulk Create Listings</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bulkCategory">Category</Label>
                <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {parentCategories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                    {subCategories?.map((cat) => {
                      const parent = categories?.find(c => c.id === cat.parent_id);
                      return (
                        <SelectItem key={cat.id} value={cat.id}>
                          {parent?.name} → {cat.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bulkProducts">Product Names (one per line)</Label>
                <Textarea
                  id="bulkProducts"
                  placeholder="Enter product names, one per line&#10;Example:&#10;Product 1&#10;Product 2&#10;Product 3"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="min-h-[200px]"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Enter each product name on a new line. Empty lines will be ignored.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateBulkListings}>Create Listings</Button>
              <Button variant="outline" onClick={() => setMode(null)}>
                Cancel
              </Button>
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
                  placeholder="e.g., Smartphones, Electronics"
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

        {mode === "subcategory" && (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Create Subcategory</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="parentCategory">Parent Category</Label>
                <Select value={parentCategoryId} onValueChange={setParentCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    {parentCategories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subCategoryName">Subcategory Name</Label>
                <Input
                  id="subCategoryName"
                  value={subCategoryName}
                  onChange={(e) => setSubCategoryName(e.target.value)}
                  placeholder="e.g., Samsung, Redmi"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateSubCategory} className="flex-1">
                  Create Subcategory
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
