# Sistema JM Técnica - Relatórios de Serviço

## Overview

This is a web-based service report management system for JM Técnica, a company that provides technical services for fuel stations and related equipment. The system allows creating, viewing, editing, printing, and deleting service reports with detailed information about equipment maintenance, parts used, and service execution details.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a traditional client-server architecture with clear separation between frontend and backend:

### Frontend Architecture
- **Technology**: Pure HTML, CSS, and JavaScript (no framework)
- **Styling**: Bootstrap 5.3.0 for responsive UI components
- **Icons**: Bootstrap Icons for visual elements
- **Structure**: Multi-page application with dedicated pages for each operation (create, view, edit, delete, print, list)
- **Local Storage**: Uses browser localStorage for offline functionality and data persistence

### Backend Architecture
- **Framework**: Flask (Python web framework)
- **Database ORM**: SQLAlchemy with Flask-SQLAlchemy
- **Migration Support**: Flask-Migrate for database schema management
- **API Structure**: RESTful API with blueprints for route organization
- **CORS Support**: Flask-CORS for cross-origin requests

## Key Components

### Database Model
- **Primary Entity**: `Relatorio` (Report) - stores all service report information
- **Fields Include**:
  - Report identification (number, date, times)
  - Company information (name, CNPJ, address)
  - Service types (stored as JSON)
  - Equipment details and test results
  - Parts information and costs
  - Technical observations

### Frontend Pages
1. **Index (index.html)**: Main dashboard and navigation hub
2. **Create (criar.html)**: Form for creating new service reports
3. **View (consultar.html)**: Search and view existing reports
4. **Edit (editar.html)**: Modify existing reports
5. **List (listar.html)**: Paginated list view of all reports
6. **Print (imprimir.html)**: Print-optimized report display
7. **Delete (excluir.html)**: Safe deletion of reports with confirmation

### JavaScript Modules
- **main.js**: Core utilities and global functions
- **criar.js**: Report creation functionality
- **consultar.js**: Search and filtering logic
- **editar.js**: Report editing capabilities
- **listar.js**: List view and pagination
- **imprimir.js**: Print formatting and display
- **excluir.js**: Safe deletion workflow

## Data Flow

1. **Report Creation**: Users fill forms that validate and store data locally, then sync with backend API
2. **Data Persistence**: Dual storage approach - local browser storage for offline access and SQLite/PostgreSQL for permanent storage
3. **Search and Filtering**: Client-side filtering for performance with server-side backup for comprehensive searches
4. **Report Generation**: Dynamic HTML/CSS generation for print-ready service reports

## External Dependencies

### Frontend Dependencies
- **Bootstrap 5.3.0**: UI framework loaded via CDN
- **Bootstrap Icons**: Icon library loaded via CDN
- **Modern Browser APIs**: LocalStorage, Print API, Date/Time APIs

### Backend Dependencies
- **Flask**: Web framework and core functionality
- **SQLAlchemy**: Database ORM and migrations
- **Flask-CORS**: Cross-origin request handling
- **pytz**: Timezone handling (Brazil/São Paulo timezone)
- **python-dotenv**: Environment variable management

## Deployment Strategy

### Development Environment
- **Database**: SQLite for simple local development
- **Server**: Flask development server
- **Configuration**: Environment variables with fallback defaults
- **CORS**: Permissive settings for local development

### Production Considerations
- **Database**: Configurable via DATABASE_URL environment variable (supports PostgreSQL)
- **Security**: Secret key management via environment variables
- **Timezone**: Configured for Brazilian timezone (America/Sao_Paulo)
- **Error Handling**: Production-ready configuration class available

### Configuration Management
- **Environment-based**: Separate configs for development and production
- **Database Flexibility**: Supports both SQLite and PostgreSQL through connection string
- **Security**: Secret key and sensitive data handled via environment variables
- **CORS**: Configurable allowed origins for different deployment scenarios

The system is designed to be easily deployable to platforms like Replit, Heroku, or similar cloud platforms with minimal configuration changes.