import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Search, Briefcase } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { StudentTaskCard } from "@/components/tasks/StudentTaskCard";
import { TaskSubmissionDialog } from "@/components/tasks/TaskSubmissionDialog";
import { useStudentTasks, type TaskWithSubmission } from "@/hooks/useStudentTasks";

type FilterStatus = "all" | "not_started" | "pending" | "needs_revision" | "approved";

export default function StudentTasks() {
  const { data: tasks, isLoading, error } = useStudentTasks();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<TaskWithSubmission | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    return tasks.filter((task) => {
      const status = task.submission?.status || "not_started";

      // Filter by status
      if (filter !== "all" && status !== filter) return false;

      // Search by title, description, or company
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDescription = task.description?.toLowerCase().includes(query);
        const matchesCompany = task.opportunity?.company_name?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription && !matchesCompany) return false;
      }

      return true;
    });
  }, [tasks, filter, searchQuery]);

  // Group tasks by opportunity
  const tasksByOpportunity = useMemo(() => {
    const grouped: Record<string, { opportunityTitle: string; companyName: string; tasks: TaskWithSubmission[] }> = {};

    filteredTasks.forEach((task) => {
      const oppId = task.opportunity_id;
      if (!grouped[oppId]) {
        grouped[oppId] = {
          opportunityTitle: task.opportunity?.title || "Unknown Opportunity",
          companyName: task.opportunity?.company_name || "Unknown Company",
          tasks: [],
        };
      }
      grouped[oppId].tasks.push(task);
    });

    return Object.values(grouped);
  }, [filteredTasks]);

  // Count tasks by status
  const statusCounts = useMemo(() => {
    if (!tasks) return { all: 0, not_started: 0, pending: 0, needs_revision: 0, approved: 0 };

    return tasks.reduce(
      (acc, task) => {
        const status = task.submission?.status || "not_started";
        acc.all++;
        acc[status as keyof typeof acc]++;
        return acc;
      },
      { all: 0, not_started: 0, pending: 0, needs_revision: 0, approved: 0 }
    );
  }, [tasks]);

  const handleOpenSubmitDialog = (task: TaskWithSubmission) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <Navbar userRole="student" />

      <main className="container py-8 flex-1">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="h-8 w-8" />
              My Tasks
            </h1>
            <p className="text-muted-foreground mt-1">
              Track and submit your micro-internship work
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {tasks?.length || 0} total tasks
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks by title, description, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterStatus)} className="mb-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">
              All ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="not_started">
              Not Started ({statusCounts.not_started})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Submitted ({statusCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="needs_revision">
              Revise ({statusCounts.needs_revision})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({statusCounts.approved})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load tasks. Please try again.</p>
          </div>
        ) : tasks && tasks.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Briefcase className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <h2 className="text-xl font-semibold text-foreground">No Active Tasks</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              You don't have any tasks yet. Apply to opportunities and get accepted to receive tasks.
            </p>
            <Button asChild>
              <Link to="/student/opportunities">Browse Opportunities</Link>
            </Button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tasks match your current filters.</p>
            <Button variant="ghost" onClick={() => { setFilter("all"); setSearchQuery(""); }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {tasksByOpportunity.map((group) => (
              <div key={group.opportunityTitle}>
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  {group.opportunityTitle}
                  <span className="text-sm font-normal text-muted-foreground">• {group.companyName}</span>
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {group.tasks.map((task, index) => (
                    <StudentTaskCard
                      key={task.id}
                      task={task}
                      taskNumber={task.order_index + 1}
                      applicationCreatedAt={task.application?.created_at || ""}
                      onSubmit={() => handleOpenSubmitDialog(task)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Submission Dialog */}
      <TaskSubmissionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedTask}
      />
    </div>
  );
}
