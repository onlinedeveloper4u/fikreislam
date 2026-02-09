# Fikr-e-Islam

Islamic Books, Audio & Video Library. Discover authentic Islamic content including books, Qur'an recitations, lectures, and educational videos for your spiritual journey.

## Technologies Used

- **Frontend**: React, Vite, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend / Database**: Supabase
- **Icons**: Lucide React
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or bun

### Installation

1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd fikreislam
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```sh
   npm run dev
   ```

## Project Structure

- `src/components`: Reusable UI components
- `src/pages`: Application pages and routes
- `src/integrations/supabase`: Supabase type definitions and client configuration
- `src/hooks`: Custom React hooks for data fetching and state management
- `supabase/migrations`: Database schema migrations
