# Afrimail - Mailcow Email Account Management Platform

A full-featured web application that enables public signup for Mailcow-hosted email accounts with comprehensive user and admin dashboards.

## Features

### User Features
- Public signup with email account creation
- Secure login with JWT authentication
- Password management (change password)
- Account recovery via email or SMS
- View mailbox quota and usage
- Update recovery contact information
- Responsive dashboard

### Admin Features
- Separate admin portal with secure authentication
- User management (view, suspend, unsuspend, delete)
- Password reset for users
- Mailbox quota management
- Domain management with DKIM support
- Email alias management
- Mail server monitoring (health, logs, queue)
- Comprehensive audit logging
- CSV export of users
- Bulk operations support

### Mailcow Integration
- Full Mailcow API integration for mail server management
- Real-time health monitoring of mail server containers
- Mailbox synchronization between local database and Mailcow
- DKIM key management (view, generate, delete)
- Mail queue and quarantine monitoring
- Rspamd statistics
- Rate limiting configuration
- Dovecot and Postfix log viewing

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: PostgreSQL with SQLAlchemy 2.0 (async)
- **Authentication**: JWT tokens with refresh token rotation
- **Password Hashing**: Argon2
- **HTTP Client**: httpx (async)
- **Email Service**: Mailcow REST API

## Prerequisites

Before setting up this application, ensure you have:

1. **Python 3.10+** installed
2. **Node.js 18+** and npm installed
3. **PostgreSQL** database server
4. A running **Mailcow** instance with API access
5. **Mailcow API key** with appropriate permissions
6. (Optional) Twilio account for SMS-based password recovery
7. (Optional) SMTP credentials for sending recovery emails

## Project Structure

```
afrimail-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # Reusable UI components
│   │   │   ├── layouts/         # Layout components
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── AdminRoute.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx  # Authentication context
│   │   ├── lib/
│   │   │   └── api.ts           # API client utilities
│   │   ├── pages/
│   │   │   ├── dashboard/       # User dashboard pages
│   │   │   ├── admin/           # Admin dashboard pages
│   │   │   └── ...
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript types
│   │   ├── App.tsx              # Main app with routes
│   │   └── main.tsx             # Entry point
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/          # API route handlers
│   │   │       ├── admin_domains.py
│   │   │       ├── admin_mailcow.py  # Mailcow integration endpoints
│   │   │       ├── admin_users.py
│   │   │       ├── auth.py
│   │   │       └── ...
│   │   ├── core/
│   │   │   ├── config.py        # Application settings
│   │   │   ├── security.py      # JWT & password utilities
│   │   │   └── database.py      # Database connection
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   └── services/
│   │       └── mailcow.py       # Mailcow API client
│   ├── scripts/                 # Database migrations
│   ├── .env                     # Environment variables
│   └── requirements.txt
└── README.md
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd afrimail-app
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template and configure
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/afrimail

# JWT Settings
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Mailcow API
MAILCOW_API_URL=https://mail.yourdomain.com/api/v1
MAILCOW_API_KEY=your-mailcow-api-key

# Optional: Email settings for password recovery
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=your-smtp-password

# Optional: Twilio for SMS recovery
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

Run the backend:

```bash
uvicorn app.main:app --reload --port 8001
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:8001
```

Run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 4. Database Setup

The database tables are created automatically on first run. To create an admin user:

```sql
-- Connect to your PostgreSQL database and run:
INSERT INTO admin_users (email, password_hash, name, role_id, is_active)
VALUES (
  'admin@example.com',
  '$argon2id$...', -- Generate using the backend's password hashing
  'Admin User',
  1,
  true
);
```

Or use the provided migration scripts in `backend/scripts/`.

## Mailcow API Configuration

### Required API Permissions

Your Mailcow API key needs the following permissions:
- Read/Write mailboxes
- Read/Write domains
- Read/Write aliases
- Read/Write DKIM
- Read logs
- Read/Write rate limits

### API Endpoints Used

The backend integrates with these Mailcow API endpoints:

**Domains:**
- `GET /api/v1/get/domain/all` - List all domains
- `GET /api/v1/get/domain/{domain}` - Get domain details
- `POST /api/v1/add/domain` - Create domain
- `POST /api/v1/edit/domain` - Update domain
- `POST /api/v1/delete/domain` - Delete domain

**Mailboxes:**
- `GET /api/v1/get/mailbox/all` - List all mailboxes
- `GET /api/v1/get/mailbox/{email}` - Get mailbox details
- `POST /api/v1/add/mailbox` - Create mailbox
- `POST /api/v1/edit/mailbox` - Update mailbox
- `POST /api/v1/delete/mailbox` - Delete mailbox

**Aliases:**
- `GET /api/v1/get/alias/all` - List all aliases
- `POST /api/v1/add/alias` - Create alias
- `POST /api/v1/edit/alias` - Update alias
- `POST /api/v1/delete/alias` - Delete alias

**DKIM:**
- `GET /api/v1/get/dkim/{domain}` - Get DKIM key
- `POST /api/v1/add/dkim` - Generate DKIM key
- `POST /api/v1/delete/dkim` - Delete DKIM key

**Monitoring:**
- `GET /api/v1/get/status/containers` - Container health
- `GET /api/v1/get/logs/{type}/{count}` - View logs
- `GET /api/v1/get/logs/rspamd-stats` - Rspamd statistics
- `GET /api/v1/get/mailq/all` - Mail queue
- `GET /api/v1/get/quarantine/all` - Quarantined messages

## Admin API Endpoints

The backend exposes these admin endpoints for Mailcow management:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/mailcow/health` | GET | Check Mailcow API health |
| `/admin/mailcow/status` | GET | Get container status |
| `/admin/mailcow/mailboxes` | GET | List all mailboxes |
| `/admin/mailcow/mailboxes/{email}` | GET | Get mailbox details |
| `/admin/mailcow/mailboxes/{email}/activate` | POST | Activate mailbox |
| `/admin/mailcow/mailboxes/{email}/deactivate` | POST | Deactivate mailbox |
| `/admin/mailcow/mailboxes/{email}/quota` | PUT | Update quota |
| `/admin/mailcow/mailboxes/bulk` | POST | Bulk operations |
| `/admin/mailcow/sync/mailboxes` | POST | Sync all mailboxes |
| `/admin/mailcow/sync/mailbox/{email}` | POST | Sync single mailbox |
| `/admin/mailcow/dkim/{domain}` | GET | Get DKIM key |
| `/admin/mailcow/dkim/{domain}` | POST | Generate DKIM key |
| `/admin/mailcow/logs/{log_type}` | GET | View logs |
| `/admin/mailcow/stats/rspamd` | GET | Rspamd statistics |
| `/admin/mailcow/quarantine` | GET | View quarantine |
| `/admin/mailcow/mail-queue` | GET | View mail queue |
| `/admin/mailcow/ratelimits` | GET | List rate limits |
| `/admin/mailcow/ratelimits/{mailbox}` | PUT | Set rate limit |

## Security Considerations

1. **API Keys**: Mailcow API keys are stored server-side only and never exposed to the frontend.

2. **JWT Tokens**: Authentication uses short-lived access tokens (30 min) with refresh token rotation.

3. **Password Hashing**: User passwords are hashed using Argon2id before storage.

4. **HTTPS**: Always use HTTPS in production for both frontend and backend.

5. **CORS**: Backend is configured with strict CORS policies.

6. **Input Validation**: All inputs are validated using Pydantic schemas.

7. **Rate Limiting**: Consider adding rate limiting middleware for production.

## Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npx tsc --noEmit` - Run TypeScript type checking

### Backend
- `uvicorn app.main:app --reload` - Start development server
- `pytest` - Run tests
- `python -m scripts.run_migration` - Run database migrations

## Deployment

### Backend Deployment

1. Set up a production PostgreSQL database
2. Configure environment variables
3. Run with a production ASGI server:
   ```bash
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

### Frontend Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to:
   - Vercel
   - Netlify
   - Cloudflare Pages
   - Nginx/Apache
   - AWS S3 + CloudFront

## Troubleshooting

### Common Issues

**Issue**: Mailcow API returns 500 errors
- Verify `MAILCOW_API_URL` doesn't have duplicate `/api/v1` path
- Check that the API key has correct permissions
- Ensure the Mailcow server is accessible from your backend

**Issue**: Cannot login after signup
- Check if mailbox was created in Mailcow
- Verify database user record was created
- Check backend logs for errors

**Issue**: Admin cannot access admin portal
- Verify admin user exists in `admin_users` table
- Check password hash was generated correctly
- Ensure JWT token is being set properly

**Issue**: TypeErrors with Mailcow data
- Mailcow API returns strings for numeric fields
- The backend uses `_safe_int()` to handle type conversion

## Contributing

1. Follow existing code style and patterns
2. Add TypeScript types for new features
3. Test all user flows before submitting
4. Update documentation for new features
5. Ensure proper error handling

## License

[Your License Here]

## Acknowledgments

- Mailcow for the excellent mail server platform
- FastAPI for the modern Python web framework
- React and Vite teams for the excellent developer experience
