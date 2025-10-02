# Scholardorm

Scholardorm is a modern web application designed to manage and visualize student dormitory data. It provides role-based access for students and administrators, offering a comprehensive platform for educational management, including courses, quizzes, games, announcements, and analytics.

## Features

- Role-based authentication and authorization (Student and Admin roles)
- Student dashboard with courses, quizzes, achievements, games, and progress tracking
- Admin dashboard with user management, course and quiz management, content and announcement management, analytics, and audit logs
- Real-time authentication and session management using Supabase
- Toast notifications and chatbot support for enhanced user experience
- Accessibility features and legal compliance pages (Terms of Service, Privacy Policy)
- Responsive UI built with React, TypeScript, and Tailwind CSS
- Routing managed with React Router v6 with role-based route protection

## Project Structure

- `src/`: Source code directory
  - `components/`: React components organized by feature and role
    - `auth/`: Authentication pages and forms
    - `dashboard/`: Student and Admin dashboards and related components
    - `layout/`: Layout and navigation components
    - `common/`: Shared UI components like buttons, inputs, toasts, and chatbot
    - `legal/`: Legal pages (Terms of Service, Privacy Policy)
    - `accessibility/`: Accessibility-related pages
  - `lib/`: Supabase client and utility functions
  - `database/`: Database schema SQL file
  - `App.tsx`: Main application component with routing and authentication logic
  - `AppRouter.tsx`: Router wrapper component
  - `index.tsx`: React app entry point
  - `index.css`: Global styles with Tailwind CSS

- `public/`: Static assets like logos

- Configuration files:
  - `package.json`: Project dependencies and scripts
  - `vite.config.ts`: Vite build configuration
  - `tailwind.config.js`: Tailwind CSS configuration
  - `tsconfig.json`: TypeScript configuration
  - `.eslintrc.cjs`: ESLint configuration

## Technologies Used

- React 18 with TypeScript
- React Router v6 for client-side routing
- Supabase for backend services (authentication, database, real-time)
- Tailwind CSS for styling
- Vite as the build tool
- ESLint for linting and code quality
- Framer Motion for animations
- Recharts for data visualization
- React Hook Form for form management
- Lucide React for icons

## Getting Started

### Prerequisites

- Node.js (v16 or later recommended)
- npm or yarn package manager

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd scholardorm
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables for Supabase (create a `.env` file):

   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173` (or the port shown in the terminal).

## Usage

- Access the login and signup pages to authenticate.
- Depending on your role (student or admin), you will be redirected to the appropriate dashboard.
- Explore features such as courses, quizzes, games, announcements, and profile management.
- Admin users can manage users, courses, quizzes, content, and view analytics.

## Testing

Currently, no automated tests are included. Manual testing should cover:

- Authentication flows (login, signup, logout)
- Role-based access control and route protection
- Dashboard functionalities for both students and admins
- Form validations and notifications
- Real-time updates and audit logs

## Contributing

Contributions are welcome! Please open issues or submit pull requests for bug fixes and feature enhancements.

## License

This project is private and not publicly licensed.

## Author

Joy
