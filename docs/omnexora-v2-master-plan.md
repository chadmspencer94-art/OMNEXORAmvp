# OMNEXORA v2 – Master Plan Checklist

This is a living document. We update it as features are built, refined, or changed. It is the source of truth for what exists now vs. what is still planned.

---

## 1. Auth & Accounts

- [x] Email/password registration
- [x] Email/password login
- [x] Basic session handling and redirects
- [x] Session cookie management with TTL
- [x] Admin role support (role-based and email-based)
- [x] User account suspension (accountStatus: SUSPENDED, BANNED)
- [x] User account banning (isBanned flag)
- [x] Last login tracking (lastLoginAt)
- [x] Activity tracking (lastActivityAt, totalJobs, totalJobPacks)
- [ ] Email verification flow (verify email on signup)
- [ ] Password reset flow (forgot password)
- [ ] Two-factor authentication (2FA)
- [ ] Social login (Google, Facebook)
- [ ] Account deletion / GDPR compliance
- [ ] Session management UI (view active sessions, revoke sessions)

---

## 2. Business / Trade Profiles

- [x] Business name and ABN storage (Prisma + KV)
- [x] Primary trade selection (Painter, Plasterer, Carpenter, Electrician, Other)
- [x] Secondary trades (comma-separated tradeTypes)
- [x] Work type flags (doesResidential, doesCommercial, doesStrata)
- [x] Service area configuration (serviceRadiusKm, servicePostcodes)
- [x] Pricing rates storage (hourlyRate, calloutFee, ratePerM2Interior, ratePerM2Exterior, ratePerLmTrim)
- [x] Business Profile page (`/settings/business-profile`)
- [x] Business Profile API (GET/POST `/api/settings/business-profile`)
- [x] Trading name field
- [ ] Business logo upload
- [ ] Business description/bio
- [ ] Portfolio/gallery of past work
- [ ] Insurance details (provider, expiry, policy number)
- [ ] Licence numbers and expiry dates
- [ ] Team size / number of employees
- [ ] Years of experience
- [ ] Specialisations and certifications
- [ ] Public-facing business profile page (for clients to view)

---

## 3. Job Packs & Documentation

### 3.1 Job Pack Creation & Management
- [x] Create new job (title, trade type, property type, address, notes)
- [x] AI-powered job pack generation (OpenAI integration)
- [x] Job pack fields: summary, quote, scope of work, inclusions, exclusions, materials, client notes
- [x] Edit job details
- [x] Delete job (soft delete)
- [x] Regenerate AI job pack
- [x] Job status tracking (draft, ai_pending, ai_complete, ai_failed, pending_regeneration)
- [x] AI review status (pending, confirmed)
- [x] Job workflow status (pending, booked, completed, cancelled)
- [ ] Duplicate/clone job
- [ ] Job templates
- [ ] Bulk job operations

### 3.2 Job Pack Output & Delivery
- [x] PDF export of job pack (jsPDF)
- [x] Email job pack to client
- [x] Copy job pack to clipboard (formatted text)
- [x] Client status tracking (draft, sent, accepted, declined, cancelled)
- [x] Materials override (user-provided materials text)
- [x] Materials rough estimate flag
- [ ] Client portal (view job packs online)
- [ ] Client signature/acceptance workflow
- [ ] SMS notifications to clients
- [ ] Job pack versioning/history

### 3.3 Safety & Compliance Documents
- [ ] SWMS (Safe Work Method Statement) generation
- [ ] Risk assessment templates
- [ ] Site-specific safety plans
- [ ] Toolbox talk templates
- [ ] Compliance checklist generation
- [ ] Document templates library
- [ ] Automated compliance document generation based on job type

---

## 4. Quoting & Pricing (Labour + Materials)

### 4.1 Pricing Configuration
- [x] User pricing settings page (`/settings`)
- [x] Hourly rate storage (hourlyRate)
- [x] Day rate storage (dayRate)
- [x] Material markup percentage (materialMarkupPercent)
- [x] Rough estimate only flag (roughEstimateOnly)
- [x] Business profile rates (calloutFee, ratePerM2Interior, ratePerM2Exterior, ratePerLmTrim)
- [x] Job-level rate overrides (labourRatePerHour, helperRatePerHour)
- [ ] Rate templates (different rates for different job types)
- [ ] Seasonal rate adjustments
- [ ] Multi-currency support

### 4.2 Quote Generation
- [x] AI-generated quotes (labour, materials, total estimate)
- [x] Quote includes labour hours and rates
- [x] Quote includes materials summary and cost
- [x] Quote includes total job estimate (range)
- [x] Pricing context passed to AI (user rates, job rates)
- [ ] Automatic rate application from business profile
- [ ] Quote templates
- [ ] Quote revision tracking
- [ ] Quote expiry dates
- [ ] Quote acceptance workflow

### 4.3 Materials Pricing Integration
- [ ] Paint Place API integration
- [ ] Dulux pricing API
- [ ] Bunnings API integration
- [ ] Real-time materials pricing lookup
- [ ] Materials cost calculator
- [ ] Bulk materials ordering
- [ ] Materials supplier comparison
- [ ] Materials price history tracking

### 4.4 Advanced Quoting Features
- [ ] Photo-to-quote pipeline (upload photos, AI generates quote)
- [ ] AI-guided quote suggestions based on previous jobs
- [ ] Quote comparison tool (compare multiple quotes)
- [ ] Quote analytics (win rate, average quote value)
- [ ] Automated quote follow-ups

---

## 5. Jobs / Pipelines & Dashboard

### 5.1 Job Management
- [x] Jobs list page (`/jobs`)
- [x] Job detail page (`/jobs/[id]`)
- [x] Job filtering and search
- [x] Job status management
- [x] Client details (name, email) per job
- [x] Job notes and additional details
- [x] Job creation date and update tracking
- [ ] Job scheduling/calendar view
- [ ] Job dependencies and workflows
- [ ] Job attachments (photos, documents)
- [ ] Job comments/notes history
- [ ] Job tags/categories

### 5.2 Dashboard
- [x] Dashboard page (`/dashboard`)
- [x] Recent jobs display
- [x] Job statistics (total, completed, pending)
- [x] Admin dashboard (pending verifications, unresolved feedback)
- [x] User activity summary
- [ ] Revenue analytics
- [ ] Job completion rate
- [ ] Client retention metrics
- [ ] Performance charts and graphs
- [ ] Customisable dashboard widgets

### 5.3 Client Management
- [x] Client name and email per job
- [x] Client status tracking (draft, sent, accepted, declined, cancelled)
- [x] Client status update API
- [ ] Client database/CRM
- [ ] Client contact history
- [ ] Client notes and tags
- [ ] Client communication log
- [ ] Client portal access

---

## 6. Admin, Verification & Compliance

### 6.1 Admin Controls
- [x] Admin users page (`/admin/users`)
- [x] User search and filtering (email, name, business name)
- [x] User filters (planStatus, accountStatus, verificationStatus)
- [x] User detail panel with full information
- [x] Ban/unban user (isBanned, accountStatus)
- [x] Suspend user (accountStatus: SUSPENDED)
- [x] Update user plan status (TRIAL, ACTIVE, PAST_DUE, CANCELLED, SUSPENDED)
- [x] Update user plan tier (FREE, TRIAL, FOUNDER, PRO, BUSINESS)
- [x] Toggle admin status
- [x] Update user role
- [x] Admin impersonation (act as user)
- [x] Impersonation banner and controls
- [x] Audit log system (tracks admin actions)
- [ ] Admin activity dashboard
- [ ] Bulk user operations
- [ ] User export functionality
- [ ] Admin permissions/roles (super admin, support, etc.)

### 6.2 Verification Workflow
- [x] User verification status (unverified, pending, verified)
- [x] Verification submission page (`/settings/verification`)
- [x] Business details collection (business name, ABN, trade types, service area)
- [x] Admin verification review page (`/admin/verification`)
- [x] Approve verification (sets status to verified)
- [x] Reject verification (sets status to unverified with reason)
- [x] Verification status badges
- [x] Verified badge display
- [ ] Document upload (ABN certificate, insurance, ID)
- [ ] Automated verification checks
- [ ] Verification expiry and renewal
- [ ] Verification history/audit trail

### 6.3 Compliance & Safety
- [ ] Compliance document generation
- [ ] Safety checklist automation
- [ ] Regulatory requirement tracking
- [ ] Insurance expiry reminders
- [ ] Licence expiry tracking
- [ ] Compliance reporting

---

## 7. Service Area & Matching

- [x] Service area storage (serviceArea, serviceAreaCity, serviceRadiusKm, servicePostcodes)
- [x] Service area configuration in business profile
- [x] Service area display in admin/users
- [ ] Service area matching algorithm (match jobs to tradies)
- [ ] Geographic job posting
- [ ] Radius-based job matching
- [ ] Postcode-based matching
- [ ] Job-to-tradie matching recommendations
- [ ] Tradie-to-job matching recommendations
- [ ] Distance calculation and display
- [ ] Service area visualisation (map view)

---

## 8. Integrations & Partnerships

### 8.1 Supplier Integrations
- [ ] Paint Place API integration
- [ ] Dulux pricing API
- [ ] Bunnings API integration
- [ ] Other supplier APIs
- [ ] Supplier price comparison
- [ ] Automated materials ordering

### 8.2 CRM & Business Tools
- [ ] CRM integration (HubSpot, Salesforce, etc.)
- [ ] Accounting software integration (Xero, QuickBooks)
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Email integration (Gmail, Outlook)
- [ ] Project management tools (Asana, Trello)

### 8.3 Communication & Marketing
- [ ] SMS integration (Twilio, etc.)
- [ ] Email marketing integration (Mailchimp, etc.)
- [ ] Social media integration
- [ ] Review platform integration (Google Reviews, etc.)

---

## 9. Analytics & Reporting

- [x] Basic job count tracking (totalJobs, totalJobPacks)
- [x] User activity tracking (lastLoginAt, lastActivityAt)
- [ ] Revenue analytics and reporting
- [ ] Job completion rate analytics
- [ ] Quote win rate analytics
- [ ] Client retention metrics
- [ ] Performance dashboards
- [ ] Custom report generation
- [ ] Export reports (PDF, CSV, Excel)
- [ ] Scheduled reports
- [ ] Business intelligence insights

---

## 10. UX, Performance & Stability

### 10.1 User Experience
- [x] Responsive design (mobile-friendly)
- [x] Loading states and error handling
- [x] Success/error messages
- [x] Navigation breadcrumbs
- [x] Settings navigation tabs
- [ ] Onboarding flow for new users
- [ ] In-app help and tooltips
- [ ] Keyboard shortcuts
- [ ] Dark mode
- [ ] Accessibility improvements (ARIA labels, screen reader support)
- [ ] Multi-language support

### 10.2 Performance
- [x] Client-side filtering and search
- [ ] Server-side pagination for large lists
- [ ] Image optimisation
- [ ] Code splitting and lazy loading
- [ ] Caching strategies
- [ ] Database query optimisation
- [ ] API response time monitoring

### 10.3 Stability & Reliability
- [x] Error handling in API routes
- [x] Soft delete for jobs
- [x] Data validation in forms
- [ ] Comprehensive error logging
- [ ] Error monitoring (Sentry, etc.)
- [ ] Automated testing (unit, integration, e2e)
- [ ] Backup and recovery procedures
- [ ] Database migration safety
- [ ] Rate limiting on APIs
- [ ] Input sanitisation and XSS protection

### 10.4 Feedback & Support
- [x] Feedback system (bug reports, ideas, questions)
- [x] Feedback log for admins (`/admin/feedback`)
- [x] Feedback status tracking (OPEN, IN_PROGRESS, RESOLVED)
- [x] Feedback messages/replies
- [x] Feedback assignment to admins
- [ ] In-app support chat
- [ ] Knowledge base / help centre
- [ ] User feedback analytics

---

## Notes

- **Current Storage**: The app uses a hybrid approach - KV storage (Vercel KV) for user sessions and job data, Prisma (SQLite) for business profile fields. This may need consolidation in the future.
- **AI Integration**: OpenAI is used for job pack generation. Consider rate limiting and cost monitoring.
- **Email**: Resend is used for transactional emails. Email templates may need enhancement.
- **PDF Generation**: jsPDF is used for job pack PDFs. Consider more advanced PDF features.
- **Verification**: Currently a manual admin review process. Consider automated checks where possible.

