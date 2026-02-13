

## Profile Completion Form for Students

Your proposed form is **comprehensive and well-structured**. Here's my recommendation on how to implement it with the existing database schema and what additional schema changes are needed.

### Form Structure (Your Proposal is Good)

Your form has two logical sections:

**Section 1: Personal Information**
- Name (prefilled from signup)
- Email (prefilled from signup, read-only)
- University
- Registration Number
- Department (dropdown)
- Semester (dropdown)

**Section 2: Profile Information**
- Bio/About
- Skills (multi-select dropdown, matching recruiter's skill taxonomy)
- GitHub URL
- LinkedIn URL
- Portfolio Website URL

### Implementation Approach

#### **Database Schema Changes Required**

The current `profiles` table only has:
- `full_name`, `avatar_url`, `email`, `created_at`, `updated_at`
- Plus recruiter fields: `company_name`, `company_logo_url`, `company_website`, `company_description`
- No student-specific fields

**We need to add these columns to `profiles` table:**
- `university` (text, nullable)
- `registration_number` (text, nullable)
- `department` (text, nullable)
- `semester` (integer, nullable)
- `bio` (text, nullable)
- `skills` (text array, nullable) — same format as recruiter's `skills_required`
- `github_url` (text, nullable)
- `linkedin_url` (text, nullable)
- `portfolio_url` (text, nullable)
- `profile_completed` (boolean, default false) — from your earlier requirement

This keeps everything in one table and avoids unnecessary joins.

#### **Form Field Requirements & Validation**

| Field | Mandatory? | Validation |
|-------|-----------|------------|
| Full Name | ✅ Yes | Min 2 chars, max 100 |
| Email | ❌ No (read-only, already verified) | N/A |
| University | ❌ Optional | Max 100 chars |
| Registration # | ❌ Optional | Max 50 chars |
| Department | ❌ Optional | From dropdown (CS, ECE, IT, etc.) |
| Semester | ❌ Optional | 1-8 |
| Bio | ❌ Optional | Max 500 chars |
| Skills | ❌ Optional | Multi-select from 30+ skills |
| GitHub | ❌ Optional | Valid URL format |
| LinkedIn | ❌ Optional | Valid URL format |
| Portfolio | ❌ Optional | Valid URL format |

**Recommendation**: Make the form minimally required (just `full_name`), but guide students to fill more fields with visual cues. This reduces friction while encouraging complete profiles.

#### **Implementation Plan**

1. **Database Migration**: Add 9 new columns to `profiles` table
2. **Create `/student/complete-profile` page** with:
   - Two-step form (Personal Info → Profile Info) OR single scrollable form
   - Progress indicator showing completion %
   - Prefilled name + email
   - Dropdown options for Department (hardcoded options) and Semester (1-8)
   - Skills dropdown pulling from a defined skill list (same as opportunities)
   - Submit button that sets `profile_completed = true`
3. **Update `ProtectedRoute.tsx`**: Check `profile_completed` flag for students, redirect to complete-profile if false
4. **Update `useAuth.tsx`**: Add new fields to Profile interface
5. **Register route in `App.tsx`**

#### **UX Considerations**

- **Two-page vs One-page**: Recommend a single page with collapsible sections or light two-step wizard (feels less intimidating than one long form)
- **Skills Selection**: Display as multi-select combobox (like cmdk component) for good UX with many options
- **URL Validation**: Use basic URL validation; let users know these help recruiters find them
- **Save Progress**: Autosave as they type (your app already has `useFormAutosave` hook)

#### **Files to Create/Modify**

**Create:**
- `src/pages/student/CompleteProfile.tsx` — the form page

**Modify:**
- `supabase/migrations/` — migration to add 9 columns
- `src/hooks/useAuth.tsx` — update Profile interface
- `src/components/ProtectedRoute.tsx` — add profile_completed check
- `src/App.tsx` — register route
- `src/integrations/supabase/types.ts` — auto-updated by migration

#### **Skills List (Predefined)**

Use a consistent skills taxonomy. Suggest aligning with recruiter's opportunities skills. Examples:
`React`, `TypeScript`, `Python`, `Node.js`, `PostgreSQL`, `AWS`, `Docker`, `Git`, `JavaScript`, `Vue.js`, `Django`, `REST APIs`, `GraphQL`, `MongoDB`, `HTML/CSS`, etc.

