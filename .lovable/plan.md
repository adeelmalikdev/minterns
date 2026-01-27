
# Comprehensive Production Plan for μ-intern Platform

## Current State Analysis

### What's Already Implemented

**Backend (Database)**
- 8 tables created: `profiles`, `user_roles`, `opportunities`, `applications`, `tasks`, `task_submissions`, `feedback`, `certificates`
- Enums for status tracking: `app_role`, `opportunity_level`, `opportunity_status`, `application_status`, `submission_status`
- RLS policies for security across all tables
- Database functions: `has_role()`, `get_user_role()`, `handle_new_user()` trigger

**Frontend**
- Authentication system (sign up/sign in with role selection)
- Role-based routing and protected routes
- Basic page structure for Student, Recruiter, and Admin dashboards
- Student Opportunities browse page with filtering (connected to backend)
- Navbar with role-based navigation
- UI component library (shadcn/ui)

### What Uses Placeholder/Mock Data
1. **Student Dashboard** - hardcoded stats, opportunities, tasks, deadlines, performance metrics
2. **Recruiter Dashboard** - hardcoded stats, chart data, active postings
3. **Admin Dashboard** - hardcoded stats, chart data, moderation queue, activity feed
4. **Landing Page** - static testimonials and stats

### Missing Pages
1. Student: Applications page, Portfolio page, Opportunity details page
2. Recruiter: Post Opportunity form, Manage Applicants page, Task Management
3. Admin: User management, detailed analytics

---

## Implementation Phases

### Phase 1: Core Data Hooks & Student Flow
**Goal:** Replace all placeholder data with real backend queries for students

**1.1 Create Data Fetching Hooks**
- `useStudentStats` - fetch application count, active tasks, completed internships, average rating
- `useStudentApplications` - fetch student's applications with opportunity details
- `useStudentTasks` - fetch assigned tasks with submission status
- `useRecommendedOpportunities` - fetch opportunities matching student's profile
- `useDeadlines` - fetch upcoming task deadlines

**1.2 Student Dashboard (Real Data)**
- Connect stats cards to `useStudentStats`
- Replace hardcoded opportunities with `useRecommendedOpportunities`
- Replace hardcoded tasks with `useStudentTasks`
- Replace deadlines sidebar with `useDeadlines`
- Add performance metrics from `feedback` table

**1.3 Opportunity Details Page**
- Create `/student/opportunities/:id` route
- Display full opportunity details, tasks, requirements
- "Apply Now" button that creates an application
- Cover letter input field for application

**1.4 Student Applications Page**
- Create `/student/applications` route
- List all student's applications with status badges
- Filter by status (pending, accepted, in_progress, completed)
- Link to opportunity details and task submissions

**1.5 Task Submission System**
- Create task submission modal/page
- Allow students to submit work (URL + notes)
- View submission status and feedback
- Progress tracking per task

---

### Phase 2: Recruiter Experience
**Goal:** Enable recruiters to post and manage opportunities

**2.1 Create Recruiter Data Hooks**
- `useRecruiterStats` - active postings count, total applicants, views
- `useRecruiterOpportunities` - opportunities posted by recruiter
- `useApplicants` - applicants for a specific opportunity
- `useRecruiterTasks` - tasks and submissions for review

**2.2 Post Opportunity Form**
- Create `/recruiter/post` route
- Form fields: title, company_name, description, skills_required (multi-select), duration_hours, level, is_remote, location, deadline, max_applicants
- Add tasks to opportunity (title, description, due_days)
- Save as draft or publish immediately

**2.3 Recruiter Dashboard (Real Data)**
- Connect stats to `useRecruiterStats`
- Chart showing applications over time
- List active postings with applicant counts
- Quick actions to view/edit postings

**2.4 Manage Applicants Page**
- Create `/recruiter/opportunities/:id/applicants`
- View all applicants with profiles
- Accept/Reject actions (update application status)
- View cover letters and resumes

**2.5 Task Review System**
- View student submissions per task
- Approve or request revision
- Provide feedback and rating
- Mark internship as complete

**2.6 Feedback & Certificates**
- Create feedback form (rating, skills demonstrated, comments)
- Auto-generate certificate on completion
- Certificate verification page

---

### Phase 3: Admin Dashboard
**Goal:** Enable platform oversight and moderation

**3.1 Admin Data Hooks**
- `useAdminStats` - total students, recruiters, opportunities, pending reviews
- `usePlatformActivity` - recent registrations, applications, completions
- `usePendingRecruiters` - recruiters awaiting approval (optional feature)
- `usePendingOpportunities` - opportunities for review (optional)

**3.2 Admin Dashboard (Real Data)**
- Connect stats to live counts from database
- Platform growth chart from user registrations over time
- Recent activity feed from applications/registrations
- Quick metrics overview

**3.3 User Management**
- Create `/admin/users` route
- List all users with roles
- View user details and activity
- Ability to deactivate accounts if needed

**3.4 Opportunity Moderation (Optional)**
- Review and approve/reject opportunities before publishing
- Flag inappropriate content

---

### Phase 4: Profile Management & Portfolio
**Goal:** Complete user profile experience

**4.1 Student Profile/Portfolio**
- Create `/student/portfolio` route
- Display completed internships with certificates
- Skills earned from feedback
- Downloadable certificate PDFs

**4.2 Profile Settings**
- Update full_name, avatar_url
- View email (read-only)
- Change password functionality

**4.3 Recruiter Profile**
- Company information display
- Contact details

---

### Phase 5: Polish & Production Readiness

**5.1 Error Handling**
- Add error boundaries
- Graceful error states for all data fetching
- Toast notifications for all actions

**5.2 Loading States**
- Skeleton loaders for all data-dependent components
- Optimistic updates for better UX

**5.3 Mobile Responsiveness**
- Test all pages on mobile
- Mobile navigation drawer
- Touch-friendly interactions

**5.4 Landing Page Updates**
- Optionally connect stats to real data
- Keep testimonials static or add dynamic reviews

**5.5 File Storage Setup**
- Create storage bucket for resumes and avatars
- Update profile to allow avatar upload
- Allow resume upload in applications

---

## Database Enhancements Needed

**Schema Additions:**
1. Add `company_logo_url` to `profiles` for recruiter branding
2. Add `bio` and `skills` fields to `profiles` for student portfolios
3. Consider adding `views` counter to `opportunities` table
4. Add `activity_log` table for admin activity feed (optional)

**Sample Data:**
- Seed 5-10 sample opportunities with tasks for testing
- This helps validate the entire flow before real users

---

## File Structure for New Components

```text
src/
  hooks/
    useStudentStats.ts
    useStudentApplications.ts
    useStudentTasks.ts
    useRecruiterStats.ts
    useRecruiterOpportunities.ts
    useApplicants.ts
    useAdminStats.ts
  
  pages/
    student/
      Dashboard.tsx (update)
      Opportunities.tsx (exists)
      OpportunityDetails.tsx (new)
      Applications.tsx (new)
      Portfolio.tsx (new)
    
    recruiter/
      Dashboard.tsx (update)
      PostOpportunity.tsx (new)
      ManageOpportunity.tsx (new)
      Applicants.tsx (new)
    
    admin/
      Dashboard.tsx (update)
      Users.tsx (new)
  
  components/
    applications/
      ApplicationCard.tsx
      ApplicationStatusBadge.tsx
    tasks/
      TaskSubmissionForm.tsx
      TaskReviewCard.tsx
    recruiter/
      OpportunityForm.tsx
      ApplicantCard.tsx
      FeedbackForm.tsx
    certificates/
      CertificateView.tsx
```

---

## Implementation Priority Order

1. **Student Applications page** - Most critical for student experience
2. **Opportunity Details + Apply** - Core user journey
3. **Post Opportunity form** - Enables recruiter content
4. **Task Submission system** - Completes the internship loop
5. **Recruiter Applicant Management** - Recruiter workflow
6. **Real dashboard stats** - Replace all placeholders
7. **Feedback & Certificates** - Completion flow
8. **Admin real data** - Platform monitoring
9. **Portfolio page** - Student showcase
10. **File storage** - Resume/avatar uploads

---

## Technical Notes

- All database queries use existing RLS policies for security
- React Query handles caching and refetching
- Supabase client is already configured
- TypeScript types are auto-generated from database schema
- Form validation using react-hook-form + zod (already installed)

---

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Phase 1: Student Flow | 4-6 prompts |
| Phase 2: Recruiter Experience | 5-7 prompts |
| Phase 3: Admin Dashboard | 2-3 prompts |
| Phase 4: Profiles & Portfolio | 2-3 prompts |
| Phase 5: Polish | 2-3 prompts |
| **Total** | **15-22 prompts** |

Each phase can be broken into smaller, focused tasks for iterative development.
