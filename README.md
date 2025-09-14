
# Data Collection System

A web-based system for collecting and validating data from various financial institutions based on MDRM (Micro Data Reference Manual) standards.

## Overview

This system allows financial institutions to submit reports containing MDRM data elements. The data is validated using configurable rules defined by internal analysts. The system supports:

- User authentication with role-based access control (external users, analysts, admins)
- MDRM element management
- Series (report types) configuration
- Report submission and validation
- Historical data comparison

## Technology Stack

### Backend
- Python with FastAPI
- SQLite database
- SQLAlchemy ORM
- JWT authentication
- Pydantic for data validation

### Frontend
- React with TypeScript
- Material-UI for components and icons
- React Router for navigation
- Axios for API communication
- Context API for state management

## Project Structure

```
mdrm-data-system/
├── backend/
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── auth/          # Authentication logic
│   │   ├── models/        # Database models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   ├── migrations/        # Database migrations
│   └── requirements.txt   # Python dependencies
├── frontend/
│   ├── public/            # Static assets
│   └── src/
│       ├── components/    # React components
│       ├── context/       # React context providers
│       ├── pages/         # Page components
│       ├── services/      # API services
│       └── utils/         # Utility functions
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   uv pip install -r requirements.txt
   ```

3. Initialize the database:
   ```
   python -m app.utils.init_db
   ```

4. Run the server:
   ```
   python run.py
   ```

The backend server will run at http://localhost:52308.

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

The frontend will be available at http://localhost:58252.

## Frontend Components

The frontend includes the following key components:

### Pages
- **Login**: User authentication page
- **Register**: New user registration page
- **Dashboard**: Overview of system activity and statistics
- **MDRMList**: Management of MDRM elements
- **SeriesList**: Management of report series
- **ReportsList**: List of submitted reports
- **ReportDetail**: Detailed view of a specific report with validation results
- **SubmitReport**: Form for submitting new reports

### Core Components
- **Layout**: Common layout with navigation and header
- **AuthContext**: Authentication state management
- **API Services**: Communication with backend endpoints

## Default Users

The system is initialized with the following default users:

- Admin:
  - Username: admin
  - Password: admin
  - Role: admin

- Analyst:
  - Username: analyst
  - Password: analyst
  - Role: analyst

- External User:
  - Username: external
  - Password: external
  - Role: external
  - Institution: 1

## MDRM Resources

- [MDRM Overview](https://www.federalreserve.gov/data/mdrm.htm)
- [MDRM Data Dictionary](https://www.federalreserve.gov/apps/mdrm/pdf/MDRM.zip)
- [Data Dictionary Documentation](https://www.federalreserve.gov/apps/mdrm/download_mdrm.htm)
- [Report Forms](https://www.federalreserve.gov/apps/reportingforms)
- [Series List](https://www.federalreserve.gov/apps/mdrm/series)
