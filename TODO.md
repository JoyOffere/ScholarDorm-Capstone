# TODO: Ensure useAuth is called on all student pages

## Information Gathered
- Reviewed all student dashboard components in `src/components/dashboard/student/`
- Identified that none of the components were using the `useAuth` hook from `AuthContext`
- Components were directly calling `supabase.auth.getUser()` for authentication

## Plan
- Add `import { useAuth } from '../../../contexts/AuthContext';` to each student dashboard component
- Add `const { user } = useAuth();` at the beginning of each component function
- Ensure the AuthContext is properly initialized and used across all student pages

## Dependent Files Edited
- [x] `src/components/dashboard/student/Dashboard.tsx`
- [x] `src/components/dashboard/student/Settings.tsx`
- [x] `src/components/dashboard/student/Quizzes.tsx`
- [x] `src/components/dashboard/student/Notifications.tsx`
- [x] `src/components/dashboard/student/Games.tsx`
- [x] `src/components/dashboard/student/Achievements.tsx`
- [x] `src/components/dashboard/student/Profile.tsx`

## Followup Steps
- [ ] Test the application to ensure all student pages load correctly
- [ ] Verify that authentication state is properly managed
- [ ] Check for any console errors related to authentication
- [ ] Commit changes to version control
