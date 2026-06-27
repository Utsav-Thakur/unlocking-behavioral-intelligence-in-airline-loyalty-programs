# LoyaltyIQ - Airline Loyalty Analytics Frontend Dashboard

LoyaltyIQ is a modern, responsive React-based dashboard designed to help airline operations teams inspect, analyze, and retain high-value loyalty members. Built using a sleek dark theme, the client integrates real-time charts, detailed passenger tables, and generative AI copywriters.

## Architectural Constraints (Followed Strictly)
- **Zero Browser Storage**: Never writes to `localStorage`, `sessionStorage`, or IndexedDB. All API authentication and key coordinates live securely in-memory inside React's `ApiKeyContext`.
- **Formless Interactions**: Avoids standard HTML `<form>` submits, capturing queries and configurations purely through direct event handlers (`onClick`/`onChange`).
- **Interactive Cross-Filtering**: Every chart node (province, tier, risk range) acts as a visual filter. Clicking charts filters the member tables in real-time.

## Tech Stack
- **Framework**: React 18, Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Queries**: TanStack React Query

## Installation & Setup

1. **Clone the repository and go to the directory**:
   ```bash
   cd frontend
   ```

2. **Install node packages**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env.development` or `.env.production` file to set your API endpoint:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. **Launch development server**:
   ```bash
   npm run dev
   ```

## Vercel Deployment

This project includes SPA rewrite directives in `vercel.json` to handle routing properly when hosted on Vercel.

---

## Author Credits

- **Built by**: Utsav Kumar Thakur
- **GitHub Profile**: [@Utsav-Thakur](https://github.com/Utsav-Thakur)
- **GitHub Repository**: [unlocking-behavioral-intelligence-in-airline-loyalty-programs](https://github.com/Utsav-Thakur/unlocking-behavioral-intelligence-in-airline-loyalty-programs)
- **LinkedIn**: [linkedin.com/in/utsav-thakur-2b01871b7](https://linkedin.com/in/utsav-thakur-2b01871b7)
- **Live Link**: [https://loyaltyiq-nine.vercel.app/](https://loyaltyiq-nine.vercel.app/)
