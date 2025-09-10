# Invoice Easy - Professional Invoice Management

A modern, full-stack invoice management application built specifically for solo operators, contractors, tradesmen, and small business owners. Built with Next.js 14, TypeScript, Tailwind CSS, Prisma, and Supabase.

## 🚀 Features

### ✅ Completed Features

#### Authentication & User Management
- **User Registration** - Sign up with email, username, password, country, and currency
- **Secure Login** - JWT-based authentication with Supabase
- **Password Reset** - Email-based password recovery
- **Multi-device Support** - Sessions persist across browsers and devices
- **User Profiles** - Complete user profile management

#### Customer Management
- **Add/Edit/Delete Customers** - Full CRUD operations for customer management
- **Dynamic Country Fields** - Business registration fields adapt based on selected country:
  - Australia → ABN (11-digit)
  - New Zealand → NZBN
  - USA → EIN
  - UK → Company Registration Number (+VAT)
  - Canada → BN with RT suffix
- **Comprehensive Customer Data** - Display name, contact info, address, business details
- **Country-Specific Validation** - Smart field validation based on country selection

#### Dashboard & Analytics
- **Modern Dashboard** - Clean, intuitive overview of business metrics
- **Overdue Invoices Section** - Red-highlighted section showing overdue invoices with:
  - Status badges (Draft/Sent/Approved)
  - Due dates (highlighted in red if overdue)
  - Invoice numbers (clickable links)
  - Customer display names
  - Amount owing
- **Paid Invoices Section** - Green-highlighted section showing completed payments with:
  - Status badges (Paid/Partially Paid)
  - Payment dates
  - Invoice numbers
  - Customer names
  - Amount paid
- **Financial Overview** - Total outstanding, total paid, invoice count, customer count

#### Database & Architecture
- **PostgreSQL Database** - Robust relational database with Supabase
- **Prisma ORM** - Type-safe database operations with migrations
- **Row Level Security** - Secure data access with RLS policies
- **Comprehensive Schema** - Users, Customers, Invoices, InvoiceItems, Payments models
- **Data Integrity** - Foreign key constraints and proper relationships

### ✅ Recently Completed Features

#### AI Chatbot Integration 
- **Natural Language Processing** - Intelligent command understanding for invoice operations
- **Voice Commands** - Create invoices, add customers, and mark payments using natural speech
- **Proactive Notifications** - Smart reminders for subscription renewals and overdue invoices
- **Conversation History** - Complete interaction logging viewable in Settings page
- **24/7 Support** - Built-in help system with contextual documentation
- **Real-time Actions** - Execute invoice operations directly through chat interface

#### Invoice Management
- **Invoice Creation** - Create new invoices with auto-generated numbers (#0001, #0002, etc.)
- **Invoice Editing** - Modify existing draft invoices (dates, PO number, notes)
- **Status Management** - Complete invoice lifecycle (Draft → Sent → Paid/Partially Paid)
- **Items Management** - Add/edit invoice line items with quantities, prices, and auto-calculated totals

#### Payment Processing
- **Payment Recording** - Mark invoices as paid or partially paid with detailed payment tracking
- **Payment Methods** - Support for cash, check, bank transfer, credit card, PayPal, Stripe, and more
- **Payment History** - Complete payment tracking with receipts for each payment
- **Automatic Status Updates** - Invoices automatically update to Paid/Partially Paid based on payments

#### PDF & Communication
- **PDF Generation** - Professional invoice and receipt PDFs with company branding
- **Real-time Email Integration** - Send invoices and receipts via SMTP email with delivery tracking
- **Professional Templates** - Clean, branded PDF layouts with company details and business registration numbers
- **Receipt Generation** - Automatic receipt creation after payment with payment summary
- **Advanced Email Tracking** - Complete email engagement tracking with delivery, open, and click monitoring
- **Instant Invoice Sending** - One-click invoice delivery with automatic status updates
- **Email Analytics** - Track email opens, clicks, bounces, and delivery confirmations with timestamped events
- **Enhanced Email Content** - Professional email subjects with business name, invoice numbers, and amounts
- **PDF Attachments** - Automatic PDF attachment with branded filename format (Invoice-0041-BusinessName.pdf)
- **Duplicate Prevention** - Smart duplicate email protection with 30-second cooldown period
- **BCC to User** - Automatic copy to business owner for record keeping

#### Advanced Features
- **AI Chatbot Integration** - Intelligent assistant for natural language invoice management
- **Voice Recognition** - Create invoices hands-free with speech-to-text technology
- **Smart Reminders** - Proactive notifications for subscription renewals and overdue invoices
- **Interaction Logging** - Complete conversation history tracking in Settings
- **Self-Diagnosis Engine** - Real-time system health monitoring and component validation
- **Diagnostic Dashboard** - Admin/dev interface for viewing system status and troubleshooting
- **Complete API** - RESTful API with authentication for all operations
- **Type Safety** - Full TypeScript coverage throughout the application
- **Modern UI** - Clean, professional interface with shadcn/ui components

#### Real-Time Tracking System
- **Enhanced Polling** - Intelligent polling system with 15-second intervals for responsive updates
- **WebSocket Support** - Real-time bidirectional communication for instant status updates (with fallback)
- **Live Activity Indicators** - Visual feedback showing real-time tracking status with connection health
- **Error Recovery** - Automatic reconnection and fallback mechanisms for reliable tracking
- **Email Engagement Analytics** - Track opens, clicks, bounces, and delivery confirmations
- **Tracking Pixel Integration** - Invisible tracking pixels for accurate email open detection
- **Webhook Support** - Email service provider webhooks for delivery status updates
- **Visual Status Indicators** - Color-coded connection status with WiFi icons and activity messages

#### Mobile Responsiveness & Theming
- **Full Mobile Support** - Responsive design across all devices with defined breakpoints (576px, 768px, 992px, 1200px)
- **Hamburger Navigation** - Touch-friendly mobile menu with slide-out navigation drawer
- **Theme Customization** - Comprehensive color selection with 8 predefined WCAG AA compliant colors
- **Real-time Preview** - Live theme color preview with instant application across the interface
- **Offline Support** - Theme preferences stored locally with automatic sync when online
- **Dynamic CSS Variables** - Advanced theming system with HSL color space conversion
- **Accessibility First** - WCAG AA compliance with proper contrast ratios and keyboard navigation
- **Cross-device Sync** - Theme preferences persist across all user devices and sessions

#### Self-Diagnosis Engine
- **Component Registry** - Maps system dependencies and validates internal linking between modules  
- **Startup Diagnostics** - Automatic health checks on application initialization
- **Workflow Validation** - Real-time validation of critical business workflows (sign-up, invoice creation, payment recording)
- **Logic Validators** - Checks data dependencies, business rules, and form action binding
- **Debug Logging** - Console and user-facing warnings for broken logic or missing dependencies
- **Diagnostic Dashboard** - Admin/dev interface for viewing component status and system health in real-time
- **Non-intrusive Design** - Fully observable by developers while remaining invisible to regular users
- **Error Detection** - Proactive identification of configuration issues, API failures, and workflow problems

## 🛠 Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **PDF Generation**: jsPDF with autoTable for professional invoices and receipts
- **Email**: Nodemailer with SMTP support
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## 🏗 Project Structure

```
├── app/                          # Next.js 14 App Router
│   ├── api/                      # API Routes
│   │   ├── users/               # User management endpoints
│   │   ├── customers/           # Customer CRUD operations
│   │   └── invoices/            # Invoice management (partial)
│   ├── dashboard/               # Protected dashboard pages
│   │   ├── customers/           # Customer management UI
│   │   └── layout.tsx           # Dashboard layout with navigation
│   ├── login/                   # Authentication pages
│   ├── signup/
│   ├── reset-password/
│   └── page.tsx                 # Landing page
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   └── protected-route.tsx      # Route protection wrapper
├── lib/                         # Utilities and configurations
│   ├── auth-context.tsx         # Authentication context
│   ├── supabase.ts             # Supabase client
│   ├── types.ts                # TypeScript interfaces
│   └── utils.ts                # Helper functions
├── prisma/                      # Database schema and migrations
│   └── schema.prisma           # Database models
└── .env                        # Environment configuration
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd invoice-easy
npm install
```

### 2. Environment Configuration

Create or update the `.env` file with your Supabase credentials:

```env
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]?schema=public"
NEXT_PUBLIC_SUPABASE_URL="https://[project-id].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[your-anon-key]"
```

**To get these values:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing one
3. Go to Settings → Database → Connection string for `DATABASE_URL`
4. Go to Settings → API Keys for the public keys

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations (only after setting up Supabase credentials)
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### 5. Environment Variable Validation

Visit `/env-check` to verify all required environment variables are properly configured.

## 📊 Current Status

### ✅ MVP Complete (100%)
- ✅ User authentication and registration
- ✅ Customer management with dynamic country fields  
- ✅ Complete invoice management (creation, editing, status tracking)
- ✅ Payment recording with partial payment support
- ✅ Professional PDF generation for invoices and receipts
- ✅ Email sending functionality with SMTP integration
- ✅ Dashboard with overdue/paid invoice sections
- ✅ Database schema and API infrastructure
- ✅ Mobile-responsive design
- ✅ Type-safe development with TypeScript

### 🎯 Production Ready Features
All core invoice management workflows are complete and ready for production use.

## 🎯 Key Differentiators

1. **Solo Operator Focus** - Designed specifically for individual contractors and small businesses
2. **Country-Aware Fields** - Dynamic business registration fields based on user's country
3. **Simple Yet Professional** - Clean, intuitive interface without unnecessary complexity
4. **Modern Tech Stack** - Built with the latest web technologies for performance and reliability
5. **Type Safety** - Full TypeScript coverage for robust development experience

## 🚀 Future Enhancements

The core MVP is complete! Future enhancements could include:

1. **Advanced Reporting** - Detailed business analytics and financial reports
2. **Bulk Operations** - Batch actions for multiple invoices
3. **Recurring Invoices** - Automated invoice generation for repeat customers
4. **Multi-currency Support** - Enhanced currency conversion and management
5. **Tax Calculations** - Automatic tax calculation based on location
6. **Client Portal** - Customer-facing portal for viewing and paying invoices
7. **Payment Gateway Integration** - Stripe, PayPal, and other payment processor integration
8. **Advanced PDF Customization** - Custom branding, logos, and template options

## 💡 Usage

### For Solo Operators
- Register with your business details and country
- Use AI assistant for hands-free invoice creation via voice commands
- Add customers with appropriate business registration fields
- Create and send professional invoices via email
- Track payments and overdue amounts  
- Generate and download professional PDF invoices and receipts
- Manage complete invoice lifecycle from draft to payment
- Get proactive reminders for important business tasks

### For Contractors & Tradesmen
- Quick customer setup with minimal required fields
- Voice-activated invoice creation perfect for field work
- Professional invoice generation with auto-numbering
- Payment tracking for project-based work
- Country-specific business registration number handling
- Email invoices directly to customers
- Download PDF receipts for payment records
- AI assistant available 24/7 for instant support

## 🎉 Complete Invoice Management Solution with AI Integration

Invoice Easy is now a fully functional, production-ready invoice management application specifically designed for solo operators, contractors, tradesmen, and small business owners. All core workflows are implemented and tested, providing a professional solution for managing the complete invoice lifecycle from creation to payment.

**NEW: AI Chatbot Integration** - The application now features an intelligent AI assistant that provides:
- Natural language invoice creation and management
- Voice command support for hands-free operation
- Proactive business reminders and notifications
- 24/7 contextual help and support
- Complete conversation history tracking

Perfect for busy professionals who need efficient, intelligent invoice management on the go.
\n+## 🏗 Deployment Notes (Prisma on Vercel)

When deploying to Vercel, the build cache can cause the Prisma Client to become outdated if `prisma generate` is not executed during the build. This results in runtime errors like:

```
Prisma has detected that this project was built on Vercel, which caches dependencies. This leads to an outdated Prisma Client because Prisma's auto-generation isn't triggered.
```

### Fix Implemented

The project adds a `postinstall` script in `package.json`:

```json
"scripts": {
  "postinstall": "prisma generate"
}
```

Vercel runs `npm install` (or `pnpm install` / `yarn install`) which triggers `postinstall`, ensuring the client is freshly generated before `next build` runs.

### If You Still See the Error
1. Make sure the `postinstall` script exists locally.
2. Trigger a clean build on Vercel (Deployment > Redeploy > Clear build cache & redeploy).
3. Confirm `prisma` and `@prisma/client` versions match in `package.json`.
4. Run locally:
   ```bash
   rm -rf node_modules .prisma
   npm install
   npm run build
   ```
5. If using environments with different schemas, ensure `DATABASE_URL` is defined at build time (Vercel Project Settings > Environment Variables).

### Alternative (Explicit Build Step)
You can also modify the build script instead of (or in addition to) `postinstall`:

```json
"build": "prisma generate && next build"
```

Keeping `postinstall` is generally preferred because it works with any build process and local development after dependency changes.

### Edge / Serverless Considerations
Prisma works best with the Node.js runtime. Ensure your API routes using Prisma are not forced into the Edge runtime. If you add `export const runtime = 'edge'` to a route that imports Prisma, move Prisma-dependent logic to a Node.js function route instead.

---
Deployment should now succeed without the Prisma Client initialization error.