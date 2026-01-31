import { useState, useMemo } from "react";
import { ClipboardCheck, Search, Inbox } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmissionReviewCard } from "@/components/recruiter/SubmissionReviewCard";
import { ReviewSubmissionDialog } from "@/components/recruiter/ReviewSubmissionDialog";
import { useRecruiterSubmissions, type SubmissionWithDetails } from "@/hooks/useRecruiterSubmissions";
import { useRecruiterOpportunities } from "@/hooks/useRecruiterData";

type FilterStatus = "all" | "pending" | "approved" | "needs_revision";

export default function RecruiterSubmissions() {
  const { data: submissions, isLoading, error } = useRecruiterSubmissions();
  const { data: opportunities } = useRecruiterOpportunities();
  
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [opportunityFilter, setOpportunityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filter and search submissions
  const filteredSubmissions = useMemo(() => {
    if (!submissions) return [];

    return submissions.filter((sub) => {
      // Filter by status
      if (filter !== "all" && sub.status !== filter) return false;

      // Filter by opportunity
      if (opportunityFilter !== "all" && sub.opportunity.id !== opportunityFilter) return false;

      // Search by student name, email, or task title
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesStudent = sub.student.full_name?.toLowerCase().includes(query);
        const matchesEmail = sub.student.email.toLowerCase().includes(query);
        const matchesTask = sub.task.title.toLowerCase().includes(query);
        if (!matchesStudent && !matchesEmail && !matchesTask) return false;
      }

      return true;
    });
  }, [submissions, filter, opportunityFilter, searchQuery]);

  // Count submissions by status
  const statusCounts = useMemo(() => {
    if (!submissions) return { all: 0, pending: 0, approved: 0, needs_revision: 0 };

    return submissions.reduce(
      (acc, sub) => {
        acc.all++;
        acc[sub.status as keyof typeof acc]++;
        return acc;
      },
      { all: 0, pending: 0, approved: 0, needs_revision: 0 }
    );
  }, [submissions]);

  const handleOpenReviewDialog = (submission: SubmissionWithDetails) => {
    setSelectedSubmission(submission);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <Navbar userRole="recruiter" />

      <main className="container py-8 flex-1">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <ClipboardCheck className="h-8 w-8" />
              Task Submissions
            </h1>
            <p className="text-muted-foreground mt-1">
              Review and provide feedback on student work
            </p>
          </div>
          {statusCounts.pending > 0 && (
            <div className="bg-warning/10 text-warning px-4 py-2 rounded-md text-sm font-medium">
              {statusCounts.pending} pending review{statusCounts.pending !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name, email, or task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={opportunityFilter} onValueChange={setOpportunityFilter}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Filter by opportunity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Opportunities</SelectItem>
              {opportunities?.map((opp) => (
                <SelectItem key={opp.id} value={opp.id}>
                  {opp.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterStatus)} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({statusCounts.approved})</TabsTrigger>
            <TabsTrigger value="needs_revision">Needs Revision ({statusCounts.needs_revision})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load submissions. Please try again.</p>
          </div>
        ) : submissions && submissions.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Inbox className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <h2 className="text-xl font-semibold text-foreground">No Submissions Yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Students haven't submitted any work yet. Once they do, you'll be able to review it here.
            </p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No submissions match your current filters.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSubmissions.map((submission) => (
              <SubmissionReviewCard
                key={submission.id}
                submission={submission}
                onReview={() => handleOpenReviewDialog(submission)}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Review Dialog */}
      <ReviewSubmissionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        submission={selectedSubmission}
      />
    </div>
  );
}
