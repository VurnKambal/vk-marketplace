# Marketplace App

A Facebook-style marketplace web application built with modern web technologies.

## Tech Stack

- **React 19** - Latest React version with improved performance
- **Next.js 15** - App Router for server-side rendering and routing
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components

## Features

### 📋 Pages & Routes
- **Homepage** (`/`) - Grid view of all marketplace listings
- **Item Detail** (`/item/[id]`) - Detailed view of individual listings
- **Create Listing** (`/create`) - Form to create new marketplace listings

### 🎨 Components
- **Header** - Navigation with search bar and Facebook-style branding
- **Sidebar** - Category navigation with item counts
- **ListingCard** - Individual item cards with price, title, and location
- **ListingGrid** - Responsive grid layout for displaying listings
- **MessageSeller** - Modal dialog for contacting sellers

### 🛍️ Marketplace Features
- Browse listings by category (Vehicles, Electronics, Home Goods, etc.)
- Search functionality in header
- Detailed item views with seller information
- Message seller functionality
- Create new listings with photo upload
- Responsive design for all screen sizes

## Getting Started

### Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production
```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Homepage with listing grid
│   ├── create/            # Create listing page
│   └── item/[id]/         # Dynamic item detail pages
├── components/            # React components
│   ├── Header.tsx         # Main navigation header
│   ├── Sidebar.tsx        # Category navigation
│   ├── ListingCard.tsx    # Individual listing cards
│   ├── ListingGrid.tsx    # Grid layout component
│   ├── MessageSeller.tsx  # Seller messaging modal
│   └── ui/               # shadcn/ui components
└── lib/
    ├── types.ts          # TypeScript interfaces and mock data
    └── utils.ts          # Utility functions
```

## Mock Data

The application includes comprehensive mock data:
- **75 listings** across multiple categories
- **19 categories** including Vehicles, Electronics, Home Goods, etc.
- Sample seller information and pricing

## Responsive Design

- **Mobile-first** approach with Tailwind CSS
- **Grid layouts** that adapt from 1 column (mobile) to 5 columns (desktop)
- **Touch-friendly** interface elements
- **Sidebar** collapses appropriately on smaller screens

## Styling

- **Tailwind CSS v4** with modern configuration
- **shadcn/ui** components for consistent design
- **Facebook-inspired** color scheme and layout
- **Custom utilities** for text truncation and layout

## Next Steps

This is a static layout with mock data. To make it fully functional, consider adding:

- **Backend API** integration
- **Database** for storing listings
- **Authentication** system
- **Real image upload** functionality
- **Search and filtering** logic
- **Messaging system** backend
- **Payment integration**

## Development

The project follows Next.js 15 App Router conventions with:
- Server and client components appropriately separated
- TypeScript for type safety
- Modern React patterns with hooks
- Accessible component design
