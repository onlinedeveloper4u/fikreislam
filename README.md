# FikreIslam v2

A modern web application built with Next.js and MongoDB.

## Features

- **Modern Stack:** Built with Next.js 16 (App Router) and React 18
- **Database:** MongoDB connected via Mongoose
- **Authentication:** Custom JWT-based authentication
- **Styling:** Tailwind CSS with Shadcn UI components
- **File Storage:** Configured for Internet Archive storage

## Getting Started

1. Clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in your connection details:
   ```env
   MONGODB_URI="mongodb+srv://..."
   JWT_SECRET="your-strong-secret"
   ```
4. Start the development server with `npm run dev`

## Deployment

The project is configured out-of-the-box for Cloudflare Pages/Workers deployment via OpenNext.
