# HR Portal Frontend

This is a React-based frontend for an HR Portal application with multiple bundles:
- Admin Bundle: For HR administrators
- Organization Bundle: For organizations to manage student data
- Exam Bundle: For conducting exams with tab-switching prevention

## Project Structure

```
src/
├── assets/                 # Static assets like images, fonts, etc.
├── bundles/                # Feature bundles
│   ├── admin/              # Admin bundle
│   │   ├── contexts/       # Admin-specific contexts
│   │   ├── layouts/        # Admin-specific layouts
│   │   ├── pages/          # Admin pages
│   │   └── AdminApp.jsx    # Admin entry point
│   ├── organization/       # Organization bundle
│   │   ├── contexts/       # Organization-specific contexts
│   │   ├── layouts/        # Organization-specific layouts
│   │   ├── pages/          # Organization pages
│   │   └── OrganizationApp.jsx # Organization entry point
│   └── exam/               # Exam bundle
│       ├── contexts/       # Exam-specific contexts
│       ├── layouts/        # Exam-specific layouts
│       ├── pages/          # Exam pages
│       └── ExamApp.jsx     # Exam entry point
├── shared/                 # Shared code across bundles
│   ├── api/                # API services
│   ├── components/         # Shared UI components
│   ├── contexts/           # Shared contexts
│   ├── hooks/              # Custom hooks
│   ├── layouts/            # Shared layouts
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
├── index.html              # HTML template
└── index.jsx               # Main entry point
```

## Features

- **Admin Bundle**
  - Login/Authentication
  - Dashboard
  - Settings

- **Organization Bundle**
  - Student data management
  - Dynamic form generation

- **Exam Bundle**
  - Tab switching prevention
  - Multiple exam rounds
  - Secure exam environment

## Development

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Running the application

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Scalability Considerations

- **Bundle-based Architecture**: Each major feature is isolated in its own bundle with dedicated contexts and components
- **Code Splitting**: Configuration for optimized chunk splitting
- **Shared Components**: Reusable components to maintain consistency across bundles
- **Centralized API Layer**: Single point for handling API communication

## Integration with Twigs Component Library

The Twigs component library will need to be configured separately. Once available, import and use Twigs components throughout the application to maintain consistency.
