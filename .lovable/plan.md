

# Task Submission System - Implementation Plan

## Overview

This plan implements a dedicated Tasks page where students can view all their assigned tasks from active internships and submit their work (URLs and notes). The system will leverage existing hooks (`useStudentTasks`, `useSubmitTask`, `useUpdateSubmission`) and follow established UI patterns from the codebase.

---

## Current State Analysis

**What Exists:**
- `useStudentTasks` hook - fetches tasks for active applications (status: accepted/in_progress)
- `useSubmitTask` mutation - creates new task submissions
- `useUpdateSubmission` mutation - updates existing submissions
- `task_submissions` table with fields: `submission_url`, `notes`, `status` (pending/approved/needs_revision)
- RLS policies already configured for students to create and update their submissions
- Dashboard shows tasks but without submission capability
- Applications page has "View Tasks" button that navigates to `/student/tasks` (page doesn't exist yet)

**What's Missing:**
- Dedicated `/student/tasks` page
- Task submission dialog/form UI
- Ability to view and edit existing submissions
- Visual feedback for submission status and recruiter feedback

---

## Implementation Steps

### Step 1: Create Student Tasks Page

**File:** `src/pages/student/Tasks.tsx`

A new page that displays all tasks grouped by opportunity/internship with:

- Header with page title and task count
- Filter tabs: All | Not Started | Submitted | Needs Revision | Approved
- Task cards showing:
  - Task title and description
  - Company/opportunity name
  - Due date (calculated from application acceptance + due_days)
  - Submission status badge
  - "Submit Work" or "Edit Submission" button
  - Recruiter feedback (if needs_revision or approved)

**UI Components Used:**
- `Tabs` for filtering
- `Card` for task display
- `Badge` for status
- `Dialog` for submission form
- `Skeleton` for loading states

### Step 2: Create Task Submission Dialog Component

**File:** `src/components/tasks/TaskSubmissionDialog.tsx`

A reusable dialog component for submitting/editing task work:

**Form Fields:**
- Submission URL (optional) - Input with URL validation
- Notes (optional) - Textarea for additional context

**Features:**
- Pre-fills existing submission data when editing
- Shows task details (title, description) in dialog header
- Submit button with loading state
- Cancel button to close without saving
- Success toast on submission
- Error handling with toast notifications

**Validation (using zod):**
- URL must be valid if provided
- At least one field (URL or notes) must be filled

### Step 3: Create Task Card Component

**File:** `src/components/tasks/StudentTaskCard.tsx`

A card component for displaying individual tasks:

**Displays:**
- Task number/order
- Task title
- Task description (truncated with expand option)
- Company name
- Due date with urgency indicator (red if < 3 days)
- Status badge with appropriate colors:
  - Not Started: gray
  - Submitted/Pending: yellow/warning
  - Approved: green/success
  - Needs Revision: red/destructive

**Actions:**
- "Submit Work" button (if no submission)
- "Edit Submission" button (if pending submission)
- "View Feedback" for approved/revision status

**Feedback Section:**
- Collapsible section showing recruiter feedback
- Visible when status is `needs_revision` or `approved`

### Step 4: Add Route to App.tsx

**File:** `src/App.tsx`

Add new protected route:
```
/student/tasks -> StudentTasks (protected, student role only)
```

### Step 5: Update Dashboard Quick Actions

**File:** `src/pages/student/Dashboard.tsx`

- Add "View All Tasks" button to the Ongoing Tasks section header
- Make task cards in dashboard clickable to navigate to tasks page

### Step 6: Update Navbar

**File:** `src/components/Navbar.tsx`

Add "Tasks" link to student navigation menu (if not already present).

---

## Data Flow

```text
+-------------------+     +------------------+     +--------------------+
|  Student Tasks    | --> | useStudentTasks  | --> | Supabase           |
|  Page             |     | (fetch)          |     | - applications     |
+-------------------+     +------------------+     | - tasks            |
        |                                          | - task_submissions |
        v                                          +--------------------+
+-------------------+     +------------------+            ^
| TaskSubmission    | --> | useSubmitTask/   | ----------+
| Dialog            |     | useUpdateSubmission
+-------------------+     +------------------+
```

---

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/student/Tasks.tsx` | Create | Main tasks page with filtering |
| `src/components/tasks/TaskSubmissionDialog.tsx` | Create | Submission form dialog |
| `src/components/tasks/StudentTaskCard.tsx` | Create | Individual task card |
| `src/App.tsx` | Update | Add `/student/tasks` route |
| `src/pages/student/Dashboard.tsx` | Update | Add navigation to tasks page |
| `src/components/Navbar.tsx` | Update | Add Tasks nav link (if needed) |

---

## Technical Details

### Task Submission Schema (zod)

```typescript
const taskSubmissionSchema = z.object({
  submissionUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  notes: z.string().max(2000, "Notes must be less than 2000 characters").optional(),
}).refine(
  (data) => data.submissionUrl || data.notes,
  { message: "Please provide either a URL or notes" }
);
```

### Status Badge Colors

```typescript
const statusConfig = {
  not_started: { label: "Not Started", color: "bg-muted text-muted-foreground" },
  pending: { label: "Under Review", color: "bg-warning/10 text-warning" },
  approved: { label: "Approved", color: "bg-success/10 text-success" },
  needs_revision: { label: "Needs Revision", color: "bg-destructive/10 text-destructive" },
};
```

### Due Date Calculation

Due dates are calculated from the application's `created_at` timestamp plus the task's `due_days` value. This logic already exists in `useDeadlines` and will be reused.

---

## UI Preview

**Tasks Page Layout:**

```text
+----------------------------------------------------------+
| [Navbar]                                                  |
+----------------------------------------------------------+
| My Tasks                                        [X] tasks |
| Track and submit your micro-internship work              |
+----------------------------------------------------------+
| [All] [Not Started] [Submitted] [Needs Revision] [Done]  |
+----------------------------------------------------------+
|                                                          |
| +------------------------------------------------------+ |
| | [1] Task Title                           [Status]    | |
| |     Company Name                                     | |
| |     Description text here...                         | |
| |     Due: Jan 15, 2026 (in 3 days)                   | |
| |                                      [Submit Work]   | |
| +------------------------------------------------------+ |
|                                                          |
| +------------------------------------------------------+ |
| | [2] Another Task                    [Needs Revision] | |
| |     Company Name                                     | |
| |     ...                                              | |
| |     [Recruiter Feedback]                             | |
| |     "Please add more details to your implementation" | |
| |                                    [Edit Submission] | |
| +------------------------------------------------------+ |
+----------------------------------------------------------+
```

**Submission Dialog:**

```text
+----------------------------------------+
| Submit Work for: Task Title            |
+----------------------------------------+
| Task Description:                      |
| [Description text here...]             |
|                                        |
| Submission URL (optional)              |
| [https://github.com/user/repo       ]  |
|                                        |
| Notes (optional)                       |
| [                                   ]  |
| [                                   ]  |
| [                                   ]  |
|                                        |
| [Cancel]              [Submit Work]    |
+----------------------------------------+
```

---

## Edge Cases Handled

1. **No active internships**: Show empty state with link to browse opportunities
2. **All tasks completed**: Show congratulatory message
3. **Task without due_days**: Display "No deadline" instead of date
4. **Failed submission**: Show error toast, keep dialog open
5. **Re-submission after revision request**: Allow editing when status is `needs_revision`

---

## Dependencies

No new dependencies required. Uses existing:
- `@tanstack/react-query` for data fetching
- `react-hook-form` + `zod` for form validation
- `date-fns` for date formatting
- Existing UI components from `src/components/ui/`

