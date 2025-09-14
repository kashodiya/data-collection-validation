
# Data Collection System

A web-based system for collecting and validating data from various financial institutions based on MDRM (Micro Data Reference Manual) standards.

**Note:** This project was completely developed using [OpenHands AI Software Engineer](https://github.com/All-Hands-AI/OpenHands).

### Starting Prompt

The following prompt was the starting point for this project:

```
I want to create a web based system, which can collect data from various institutions. Data is defined as series or reports. Each series has set off data elements. This data elements are called MDRM. When the data is submitted by the institutions, they are validated using set of rules defined by our internal analysts. 

The system will have flxible system of managing data validation rules. Some rules may use the direct and computed values of previously submitted reports. 

The system should also define the data format in which the data will be uploaded. 

You can learn about MDRM here: https://www.federalreserve.gov/data/mdrm.htm
You can download MDRM data dictionary from: https://www.federalreserve.gov/apps/mdrm/pdf/MDRM.zip
You can learn about data dictionary columns etc. here: https://www.federalreserve.gov/apps/mdrm/download_mdrm.htm

We also publish a PDF form for each report. Along with the report we publish instructions. You can search such forms and instructions here: https://www.federalreserve.gov/apps/reportingforms

You can find complete list of series or reports here: https://www.federalreserve.gov/apps/mdrm/series

## Guide
- Use Python
- Use one server for both serving web app as well as serving APIs
- Juse use FastAPI for app and api server (do not use Flask)
- Use SQLite for DB
- Use React for frontend
- Keep architecture simple
- Use uv for Python package management
- Keep authentication system simple, using password in the database
- Keep simple role based access control. We will have external users, internal anaysts and admin roles.
```

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
