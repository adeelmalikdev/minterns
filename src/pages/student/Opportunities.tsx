import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronDown } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OpportunityFilters } from "@/components/opportunities/OpportunityFilters";
import { OpportunityListCard } from "@/components/opportunities/OpportunityListCard";
import { useOpportunities } from "@/hooks/useOpportunities";
import { Skeleton } from "@/components/ui/skeleton";

interface FilterState {
  duration: string[];
  level: string[];
  skills: string[];
  type: string[];
}

export default function Opportunities() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filters, setFilters] = useState<FilterState>({
    duration: [],
    level: [],
    skills: [],
    type: [],
  });

  const { data: opportunities, isLoading, error } = useOpportunities(
    { ...filters, search },
    sortBy
  );

  const sortLabel = sortBy === "recent" ? "Most Recent" : "Oldest First";

  const handleViewDetails = (id: string) => {
    navigate(`/student/opportunities/${id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar userRole="student" />

      <main className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore Opportunities</h1>
          <p className="text-muted-foreground">
            Find micro-internships that match your skills
          </p>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <OpportunityFilters filters={filters} onFilterChange={setFilters} />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search and Sort */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search opportunities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 shrink-0">
                    {sortLabel}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy("recent")}>
                    Most Recent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                    Oldest First
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Opportunities List */}
            <div className="space-y-4">
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-lg border bg-card p-5">
                    <div className="flex gap-4">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-destructive">
                    Failed to load opportunities. Please try again.
                  </p>
                </div>
              ) : opportunities && opportunities.length > 0 ? (
                opportunities.map((opportunity) => (
                  <OpportunityListCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    onViewDetails={handleViewDetails}
                  />
                ))
              ) : (
                <div className="text-center py-12 border rounded-lg bg-muted/30">
                  <p className="text-muted-foreground mb-2">
                    No opportunities found
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters or search query
                  </p>
                </div>
              )}
            </div>

            {/* Results count */}
            {!isLoading && opportunities && opportunities.length > 0 && (
              <p className="text-sm text-muted-foreground mt-6 text-center">
                Showing {opportunities.length} opportunity{opportunities.length !== 1 ? "ies" : "y"}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
