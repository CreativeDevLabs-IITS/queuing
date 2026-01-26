# Web-based Queuing System

A comprehensive web-based queuing system with three main roles: Client, Staff, and Admin.

## Features

### Client Role (No Login Required)
- QR code access to join queue
- Mobile-first registration form
- Real-time queue monitoring
- Success page with queue status
- Public monitoring page with video player

### Staff Role
- Secure authentication
- Window assignment
- Queue management with priority handling
- Analytics and reporting
- Real-time dashboard updates

### Admin Role
- Full system management
- Staff account management
- Window configuration
- Category and subcategory management
- Comprehensive reporting and analytics

## Tech Stack

- **Frontend**: React 18 with Vite
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM
- **Charts**: Recharts
- **Authentication**: JWT

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository and install dependencies:

```bash
npm run install:all
```

2. Set up environment variables:

Create a `.env` file in the `backend` directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/queing_db"
JWT_SECRET="your-secret-key-here"
PORT=5000
```

3. Set up the database:

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

4. Create an admin account (optional - you can also create one through the admin interface):

You can create an admin account by running a script or directly through the database. For now, you can use Prisma Studio:

```bash
npx prisma studio
```

Or create one programmatically by adding a seed script.

5. Add videos (optional):

Place video files (mp4, webm, ogg, mov, avi) in the `backend/videos` directory. The system will automatically detect and serve them.

### Running the Application

1. Start both frontend and backend:

```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend dev server on http://localhost:3000

2. Or run them separately:

```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend
npm run dev
```

## Usage

### Client Flow

1. Access the system via QR code or navigate to `/`
2. Fill in the registration form
3. Get assigned a queue number (format: `MMDDYY-XXXX`)
4. Monitor queue status on the success page
5. View public monitoring page at `/monitor`

### Staff Flow

1. Login at `/staff/login`
2. Assign yourself to a window
3. Manage queue: start serving, mark as served, or skip
4. View analytics and statistics

### Admin Flow

1. Login at `/admin/login`
2. Manage staff accounts
3. Configure windows
4. Set up categories and subcategories
5. View comprehensive reports

## Queue Number Format

Queue numbers follow the format: `MMDDYY-XXXX`
- `MMDDYY`: Date prefix (e.g., 012526 for January 25, 2026)
- `XXXX`: 4-digit daily counter starting at 1

The counter resets daily and is concurrency-safe.

## API Endpoints

### Public Endpoints
- `POST /api/queue/join` - Join queue
- `GET /api/queue/:queueNumber` - Get queue entry
- `GET /api/queue/public/windows` - Get active windows
- `GET /api/categories` - Get categories
- `GET /api/videos` - Get video list

### Staff Endpoints (Requires Authentication)
- `GET /api/staff/dashboard` - Get dashboard data
- `POST /api/staff/assign-window` - Assign window
- `POST /api/staff/serve/:id` - Start serving
- `POST /api/staff/complete/:id` - Mark as served
- `POST /api/staff/skip/:id` - Skip client
- `GET /api/staff/analytics` - Get analytics

### Admin Endpoints (Requires Authentication)
- `GET /api/admin/dashboard` - Get dashboard stats
- `GET /api/admin/staff` - Get all staff
- `POST /api/admin/staff` - Create staff
- `PUT /api/admin/staff/:id` - Update staff
- `GET /api/admin/windows` - Get all windows
- `POST /api/admin/windows` - Create window
- `PUT /api/admin/windows/:id` - Update window
- `DELETE /api/admin/windows/:id` - Delete window
- `GET /api/admin/categories` - Get categories
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category
- `GET /api/admin/reports` - Get reports

## Database Schema

The system uses Prisma with the following main models:
- `Admin` - Admin accounts
- `Staff` - Staff accounts
- `Window` - Service windows
- `Category` - Concern categories
- `SubCategory` - Subcategories
- `QueueEntry` - Queue entries
- `ServingLog` - Serving history for analytics
- `DailyCounter` - Daily queue counter

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control
- Input validation
- SQL injection protection (Prisma)

## Real-time Updates

The system uses polling (every 2-3 seconds) for near real-time updates on:
- Public monitoring page
- Client success page
- Staff dashboard
- Admin dashboard

## Responsive Design

The system is fully responsive and works on:
- Mobile devices (primary for clients)
- Tablets
- Desktop computers

## License

MIT
