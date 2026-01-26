# Setup Guide

## Quick Start

1. **Install dependencies:**

   ```bash
   npm run install:all
   ```

2. **Set up environment:**

   - Create `backend/.env` file with:
     ```
     DATABASE_URL="file:./dev.db"
     JWT_SECRET="your-secret-key-change-this-in-production"
     PORT=5000
     ```
   - Note: The system uses SQLite by default for easy setup. For production, you can switch to PostgreSQL by changing the provider in `prisma/schema.prisma` and updating `DATABASE_URL`.

3. **Set up database:**

   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev
   npm run seed
   ```

4. **Start the application:**

   ```bash
   # From root directory
   npm run dev
   ```

   Or run separately:

   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Public queue: http://localhost:3000/
   - Staff login: http://localhost:3000/staff/login
   - Admin login: http://localhost:3000/admin/login

## Default Credentials (After Seeding)

- **Admin**: username=`admin`, password=`admin123`
- **Staff**: username=`staff1`, password=`staff123`

⚠️ **Important**: Change these passwords immediately after first login!

## Adding Videos

Place video files in `backend/videos/` directory. Supported formats:

- .mp4
- .webm
- .ogg
- .mov
- .avi

Videos will automatically appear on the public monitoring page.

## Database Management

- **View data**: `npx prisma studio`
- **Reset database**: `npx prisma migrate reset`
- **Create migration**: `npx prisma migrate dev --name migration_name`

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env` file
- Verify database exists

### Port Already in Use

- Change `PORT` in `backend/.env`
- Update `vite.config.js` proxy settings if needed

### Module Not Found Errors

- Run `npm install` in both `backend` and `frontend` directories
- Run `npx prisma generate` in `backend` directory

## Production Deployment

1. Build frontend:

   ```bash
   cd frontend
   npm run build
   ```

2. Set production environment variables

3. Use a process manager (PM2, systemd, etc.) for the backend

4. Serve frontend build files through a web server (nginx, Apache, etc.)

5. Configure reverse proxy for API routes
