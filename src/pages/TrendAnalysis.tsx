import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Search } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

const TrendAnalysis = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);

  const { data: result, isLoading } = useQuery({
    queryKey: ["search-listing", searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, categories(name)")
        .ilike("product_name", `%${searchTerm}%`)
        .limit(1)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: searchTriggered && searchTerm.length > 0,
  });

  const handleSearch = () => {
    setSearchTriggered(true);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">Trend Analysis</h1>
        </div>

        <Card className="p-6 space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for a product..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSearchTriggered(false);
              }}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          {searchTriggered && (
            <div className="mt-6">
              {isLoading ? (
                <p className="text-muted-foreground">Searching...</p>
              ) : result ? (
                <Card className="p-6 space-y-4">
                  <h3 className="text-xl font-semibold">Product Found</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Product Name</p>
                      <p className="font-medium">{result.product_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Title</p>
                      <p className="font-medium">{result.title || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="font-medium">{result.categories?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Stage</p>
                      <StatusBadge status={result.status} />
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="font-medium">{result.description || "N/A"}</p>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-6">
                  <p className="text-center text-muted-foreground">
                    Not in System
                  </p>
                </Card>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TrendAnalysis;
