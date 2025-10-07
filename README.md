# Scholardorm

Scholardorm is a comprehensive educational platform designed to enhance learning experiences for students through interactive courses, quizzes, games, and achievements. A key feature of the platform is its integrated Rwandan Sign Language (RSL) learning module, making it a pioneer in inclusive education technology in Rwanda.

The platform provides role-based access for students and administrators, offering a complete ecosystem for educational management, content delivery, and accessibility support.

## Rwandan Sign Language (RSL) Learning Module

Scholardorm features a dedicated Rwandan Sign Language learning module that promotes inclusive education and cultural preservation. This module is designed to:

- **Support Deaf and Hard-of-Hearing Students**: Provide accessible educational resources in RSL
- **Promote Inclusive Communication**: Bridge communication gaps between deaf and hearing individuals
- **Preserve Cultural Heritage**: Document and teach Rwandan Sign Language as a vital cultural asset
- **Enhance Academic Success**: Enable deaf students to participate fully in educational activities

### RSL Content Types

- **RSL Videos**: Curated YouTube videos featuring native signers demonstrating RSL signs, phrases, and conversations
- **RSL Signs**: Interactive sign database with descriptions, categories, and usage examples
- **Learning Progress Tracking**: Personalized learning paths with mastery level tracking
- **Accessibility Settings**: Customizable video playback, captions, and interface adaptations

### RSL Categories

The RSL content is organized into comprehensive categories:
- **Education**: School, learning, study, book
- **Greetings**: Hello, goodbye, thank you, please
- **Navigation**: Help, next, back, menu, directions
- **Emotions**: Happy, sad, excited, confused, angry
- **Health**: Doctor, medicine, hospital, symptoms
- **Technology**: Computer, phone, internet, social media
- **Culture**: Rwanda-specific signs, traditions, community work (Umuganda)
- **Sports**: Football, basketball, running, games
- **Academic Subjects**: Math, science, history, literature
- **Common Phrases**: Everyday expressions and conversational RSL

## Features

### Core Educational Features
- Role-based authentication and authorization (Student and Admin roles)
- Student dashboard with courses, quizzes, achievements, games, and progress tracking
- Admin dashboard with user management, course and quiz management, content and announcement management, analytics, and audit logs
- Interactive learning modules with multimedia content
- Gamification elements including leaderboards and achievement systems
- Real-time notifications and announcements

### RSL-Specific Features
- Comprehensive RSL video library with YouTube integration
- Interactive RSL sign dictionary with search and filtering
- Category-based content organization for structured learning
- Admin RSL content management with CRUD operations
- User progress tracking and learning analytics
- Accessibility customization (video speed, captions, high contrast)
- RSL practice exercises and interactive lessons

### Technical Features
- Real-time authentication and session management using Supabase
- Toast notifications and chatbot support for enhanced user experience
- Responsive UI built with React, TypeScript, and Tailwind CSS
- Routing managed with React Router v6 with role-based route protection
- Error boundary components for robust error handling
- Accessibility features and legal compliance pages (Terms of Service, Privacy Policy)

## Project Structure

- `src/`: Source code directory
  - `components/`: React components organized by feature and role
    - `auth/`: Authentication pages and forms (including RSL modal)
    - `dashboard/`: Student and Admin dashboards and related components
      - `student/`: Student-specific features (courses, quizzes, achievements, games, progress tracking)
      - `admin/`: Admin management interfaces (users, courses, quizzes, RSL content, analytics)
    - `layout/`: Layout and navigation components (navbar, sidebar, footer, dashboard layout)
    - `common/`: Shared UI components (buttons, inputs, toasts, chatbot, RSL widget)
    - `legal/`: Legal compliance pages (Terms of Service, Privacy Policy)
    - `accessibility/`: Accessibility features including RSL learning page
    - `learning/`: Educational content components
  - `lib/`: Core services and utilities
    - `rsl-service.ts`: RSL content management and learning progress tracking
    - `supabase.ts`: Supabase client configuration
    - `database-utils.ts`: Database operations and queries
    - `supabase-utils.ts`: Additional Supabase utilities and audit logging
  - `database/`: Database schema and seed data
    - `schema.sql`: Main database schema
    - `add_rsl_tables.sql`: RSL-specific tables (videos and signs)
    - `rls-seed.sql`: Sample RSL content data
    - `add_course_id_to_lessons.sql`: Course structure enhancements
  - `contexts/`: React context providers
    - `AuthContext.tsx`: Authentication state management
  - `App.tsx`: Main application component with routing and authentication logic
  - `AppRouter.tsx`: Router wrapper component with role-based route protection
  - `index.tsx`: React app entry point
  - `index.css`: Global styles with Tailwind CSS

- `public/`: Static assets including Scholardorm logo

- `migrations/`: Database migration scripts for schema updates and optimizations

- Configuration files:
  - `package.json`: Project dependencies, scripts, and metadata
  - `vite.config.ts`: Vite build configuration for development and production
  - `tailwind.config.js`: Tailwind CSS configuration with custom theme
  - `tsconfig.json`: TypeScript configuration for type checking
  - `.eslintrc.cjs`: ESLint configuration for code quality
  - `vercel.json`: Deployment configuration for Vercel

## Technologies Used

### Frontend Framework
- **React 18** with TypeScript for type-safe component development
- **React Router v6** for client-side routing with role-based route protection
- **Tailwind CSS** for responsive, utility-first styling with custom theme configuration
- **Framer Motion** for smooth animations and transitions
- **Lucide React** for consistent, accessible iconography

### Backend & Database
- **Supabase** for backend-as-a-service including:
  - Authentication with role-based access control
  - PostgreSQL database with real-time subscriptions
  - Row Level Security (RLS) for data protection
  - File storage for multimedia content
- **Database Schema** with specialized tables for RSL content, user progress tracking, and educational data

### Development Tools
- **Vite** as the fast build tool and development server
- **TypeScript** for static type checking and enhanced developer experience
- **ESLint** for code quality and consistency enforcement
- **PostCSS** with Autoprefixer for CSS processing

### Additional Libraries
- **Recharts** for interactive data visualization in analytics dashboards
- **React Hook Form** for efficient form state management and validation
- **React Error Boundary** for graceful error handling
- **Context API** for global state management (authentication, user preferences)

### RSL-Specific Technologies
- **YouTube API Integration** for embedding educational sign language videos
- **Custom RSL Service Layer** for content management and learning progress tracking
- **Accessibility APIs** for customizable video playback and interface adaptations

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

Contributions are welcome (after my capstone Defense, of course)! Please open issues or submit pull requests for bug fixes and feature enhancements.

## License

This project is private and not publicly licensed.

## Link to Software
https://scholardorm-lms.vercel.app/


## Link to Demo


## Figma Link
https://www.figma.com/design/sGBj3LQ856Ffliu4rReGVL/Capstone?node-id=0-1&p=f&t=HJkD0LabE0whHPjh-0

## Author

Joy Offere
