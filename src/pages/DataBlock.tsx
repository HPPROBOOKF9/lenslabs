import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteListingButton } from "@/components/DeleteListingButton";

const DataBlock = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: searchResults } = useQuery({
    queryKey: ["search-listings", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      
      const { data, error } = await supabase
        .from("listings")
        .select("*, categories(name)")
        .is("deleted_at", null)
        .or(`product_name.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      
      if (error) throw error;
      return data;
    },
    enabled: searchQuery.trim().length > 0,
  });

  const { data: categoryStats } = useQuery({
    queryKey: ["category-stats"],
    queryFn: async () => {
      const { data: categories, error } = await supabase
        .from("categories")
        .select("*")
        .is("parent_id", null);
      
      if (error) throw error;

      const { data: listings, error: listError } = await supabase
        .from("listings")
        .select("category_id")
        .is("deleted_at", null);
      
      if (listError) throw listError;

      return categories.map(cat => ({
        ...cat,
        productCount: listings.filter(l => l.category_id === cat.id).length,
      }));
    },
  });

  const { data: subcategoryStats } = useQuery({
    queryKey: ["subcategory-stats"],
    queryFn: async () => {
      const { data: subcategories, error } = await supabase
        .from("categories")
        .select("*, parent:categories!parent_id(name)")
        .not("parent_id", "is", null);
      
      if (error) throw error;

      const { data: listings, error: listError } = await supabase
        .from("listings")
        .select("category_id")
        .is("deleted_at", null);
      
      if (listError) throw listError;

      return subcategories.map(subcat => ({
        ...subcat,
        productCount: listings.filter(l => l.category_id === subcat.id).length,
      }));
    },
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">Data Block</h1>
        </div>

        {/* Search Section */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name, title, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {searchQuery && searchResults && searchResults.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-3">
                  Search Results ({searchResults.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((listing) => (
                      <TableRow key={listing.id}>
                        <TableCell className="font-medium">{listing.product_name}</TableCell>
                        <TableCell>{listing.title}</TableCell>
                        <TableCell>{listing.categories?.name}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-md bg-accent text-accent-foreground text-xs uppercase">
                            {listing.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DeleteListingButton listingId={listing.id} queryKey={["search-listings", searchQuery]} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {searchQuery && searchResults && searchResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No products found matching "{searchQuery}"
              </div>
            )}
          </div>
        </Card>

        {/* Categories and Subcategories Tabs */}
        <Card className="p-6">
          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="mt-6">
              <h3 className="text-lg font-semibold mb-4">All Categories</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead className="text-right">Product Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryStats?.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-right">
                        <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground font-semibold">
                          {category.productCount}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!categoryStats || categoryStats.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        No categories found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="subcategories" className="mt-6">
              <h3 className="text-lg font-semibold mb-4">All Subcategories</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subcategory Name</TableHead>
                    <TableHead>Parent Category</TableHead>
                    <TableHead className="text-right">Product Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subcategoryStats?.map((subcategory) => (
                    <TableRow key={subcategory.id}>
                      <TableCell className="font-medium">{subcategory.name}</TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {subcategory.parent?.name || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground font-semibold">
                          {subcategory.productCount}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!subcategoryStats || subcategoryStats.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No subcategories found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default DataBlock;
