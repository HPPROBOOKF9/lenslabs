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
import { DeleteCategoryButton } from "@/components/DeleteCategoryButton";
import { DeleteBrandButton } from "@/components/DeleteBrandButton";

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
        .select("*, categories(name), brands(name)")
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
        .select("*");
      
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

  const { data: brandStats } = useQuery({
    queryKey: ["brand-stats"],
    queryFn: async () => {
      const { data: brands, error } = await supabase
        .from("brands")
        .select("*");
      
      if (error) throw error;

      const { data: listings, error: listError } = await supabase
        .from("listings")
        .select("brand_id")
        .is("deleted_at", null);
      
      if (listError) throw listError;

      return brands.map(brand => ({
        ...brand,
        productCount: listings.filter(l => l.brand_id === brand.id).length,
      }));
    },
  });

  const { data: duplicateListings } = useQuery({
    queryKey: ["duplicate-listings"],
    queryFn: async () => {
      const { data: listings, error } = await supabase
        .from("listings")
        .select("*, categories(name), brands(name)")
        .is("deleted_at", null);
      
      if (error) throw error;

      // Group by product_name to find duplicates
      const grouped = listings.reduce((acc, listing) => {
        const key = listing.product_name.toLowerCase().trim();
        if (!acc[key]) acc[key] = [];
        acc[key].push(listing);
        return acc;
      }, {} as Record<string, typeof listings>);

      // Filter only groups with more than one item
      return Object.values(grouped).filter(group => group.length > 1);
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

        {/* Categories and Brands Tabs */}
        <Card className="p-6">
          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="brands">Brands</TabsTrigger>
              <TabsTrigger value="duplicates">Duplicate Listings</TabsTrigger>
              <TabsTrigger value="listed">Listed Products</TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="mt-6">
              <h3 className="text-lg font-semibold mb-4">All Categories</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead className="text-right">Product Count</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell className="text-right">
                        <DeleteCategoryButton 
                          categoryId={category.id}
                          categoryName={category.name}
                          productCount={category.productCount}
                        />
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

            <TabsContent value="brands" className="mt-6">
              <h3 className="text-lg font-semibold mb-4">All Brands</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand Name</TableHead>
                    <TableHead className="text-right">Product Count</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brandStats?.map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell className="font-medium">{brand.name}</TableCell>
                      <TableCell className="text-right">
                        <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground font-semibold">
                          {brand.productCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DeleteBrandButton 
                          brandId={brand.id}
                          brandName={brand.name}
                          productCount={brand.productCount}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!brandStats || brandStats.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No brands found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="duplicates" className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Duplicate Listings</h3>
              {duplicateListings && duplicateListings.length > 0 ? (
                <div className="space-y-6">
                  {duplicateListings.map((group, groupIndex) => (
                    <Card key={groupIndex} className="p-4">
                      <h4 className="font-semibold mb-3 text-primary">
                        Product: {group[0].product_name} ({group.length} duplicates)
                      </h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Brand</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.map((listing) => (
                            <TableRow key={listing.id}>
                              <TableCell className="font-medium">{listing.title || '-'}</TableCell>
                              <TableCell>{listing.categories?.name || '-'}</TableCell>
                              <TableCell>{listing.brands?.name || '-'}</TableCell>
                              <TableCell>
                                <span className="px-2 py-1 rounded-md bg-accent text-accent-foreground text-xs uppercase">
                                  {listing.status}
                                </span>
                              </TableCell>
                              <TableCell>
                                {new Date(listing.created_at || '').toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <DeleteListingButton 
                                  listingId={listing.id} 
                                  queryKey={["duplicate-listings"]} 
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No duplicate listings found
                </div>
              )}
            </TabsContent>

            <TabsContent value="listed" className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Listed Products</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults?.filter(l => l.status === 'published').map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell className="font-medium">{listing.product_name}</TableCell>
                      <TableCell>{listing.title || '-'}</TableCell>
                      <TableCell>{listing.categories?.name || '-'}</TableCell>
                      <TableCell>{listing.brands?.name || '-'}</TableCell>
                      <TableCell>
                        {new Date(listing.created_at || '').toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DeleteListingButton 
                          listingId={listing.id} 
                          queryKey={["search-listings", searchQuery]} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!searchResults || searchResults.filter(l => l.status === 'published').length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No listed products found
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
