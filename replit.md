# Navy Display System - Documentação Técnica

## Overview

The Navy Display System is a PDF document display platform for the Brazilian Navy, designed for automated display of PLASA (Weekly Service Plan) and Escala (Service Schedule) documents. It features intelligent scrolling, notice management, and a responsive design. The system aims to streamline the display of critical military documents and information, enhancing operational efficiency and communication within the Navy.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React Context API
- **PDF Rendering**: PDF.js for browser-based PDF display
- **Routing**: Wouter for client-side routing

### Technical Implementations
- **Backend**: Node.js with Express.js (TypeScript, ES modules)
- **API Design**: RESTful with structured error handling
- **Middleware**: Multer for file uploads, CORS configuration
- **Database**: PostgreSQL with Drizzle ORM for type-safe operations, connection pooling
- **In-Memory Storage**: MemStorage for development/demo
- **File Storage**: Local filesystem for PDF uploads
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **Cache Management**: File system cache for PDF page processing

### Feature Specifications
- **PDF Display Engine**: Automatic document rotation (PLASA, Escala), smooth continuous scrolling with configurable speeds, auto-restart, real-time PDF processing and caching, multi-page support, mobile-responsive viewport.
- **Military Personnel Management**: Complete rank and specialty system for Brazilian Navy, dynamic officer and master personnel selection, support for 47 personnel (12 officers, 35 masters), military insignia display, duty officer assignment with formatted display, real-time updates.
- **Weather Integration**: Multi-source temperature verification (wttr.in + open-meteo.com), real-time weather for Rio de Janeiro with Portuguese translations, smart rain prediction with future-time validation, 15-minute automatic updates.
- **Notice Management**: Priority-based notice rotation, date range validation, rich text content, visual priority indicators, seamless integration with main display.
- **Administrative Interface**:
    - **Document Management**: Multi-file PDF upload (drag-and-drop), automatic categorization (PLASA, Escala, Cardápio), real-time processing, rotation control, preview, file size validation.
    - **Personnel Administration**: Dynamic military personnel CRUD, real-time combobox population, officer and master classification with automatic rank validation, specialty assignment, immediate synchronization.
    - **System Configuration**: Cache management, system information display, weather monitoring dashboard, database connection status, maintenance tools.

### System Design Choices
- **Data Flow**: PDF files uploaded, processed (pages to images), cached, then rendered by frontend. Notices are created, validated, stored, and displayed based on active status.
- **Real-time Updates**: Polling mechanism for document and notice updates, automatic refresh on configuration changes.
- **Security**: Zod schema validation, restricted PDF file uploads, parameterized queries, CORS configuration.
- **Offline Deployment**: Bundled Node.js and Oracle Linux support for isolated deployment.

## External Dependencies

- **React Ecosystem**: `react`, `react-dom`, `@types/react`
- **UI Framework**: `@radix-ui/components`, `lucide-react`
- **Styling**: `tailwindcss`, `autoprefixer`, `postcss`
- **Build Tools**: `vite`, `@vitejs/plugin-react`, `typescript`
- **Backend**: `express`, `multer`, `drizzle-orm`
- **Database**: `@neondatabase/serverless`, `connect-pg-simple`
- **Utilities**: `date-fns`, `clsx`, `class-variance-authority`
- **External APIs**:
    - `wttr.in` (weather data)
    - `open-meteo.com` (weather data for cross-validation)
    - `PDF.js CDN` (browser-based PDF rendering)
    - `Sunrise-Sunset API` (fetches daily sunset times)