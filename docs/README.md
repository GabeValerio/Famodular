# Next.js Starter Template

A modern, full-featured Next.js starter template with authentication, payments, and admin panel.

## Features

- 🔐 **Authentication**: NextAuth.js with role-based access control
- 🛒 **Shopping Cart**: Full e-commerce functionality with cart management
- 💳 **Payments**: Stripe integration for secure payments
- 📊 **Admin Panel**: Comprehensive dashboard for managing your app
- 🗄️ **Database**: Supabase for data storage
- 📁 **File Uploads**: Cloudinary integration
- 🎨 **UI Components**: shadcn/ui with Tailwind CSS
- 📱 **Responsive**: Mobile-first design

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd nextjs-starter-template
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your variables:

```bash
cp .env.local.example .env.local
```

Fill in your environment variables:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXTAUTH_SECRET=your_random_secret_here

# Optional (for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Optional (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Database Setup

Create a Supabase project and run the following SQL to set up your database:

```sql
-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create site_config table
CREATE TABLE site_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default site config
INSERT INTO site_config (key, value, description) VALUES
  ('site_name', '"My App"', 'The name of your application'),
  ('site_description', '"A modern web application"', 'Site description'),
  ('maintenance_mode', 'false', 'Whether the site is in maintenance mode');
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── admin/             # Admin panel pages
│   ├── api/               # API routes
│   ├── login/             # Authentication pages
│   ├── register/          # Registration page
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility functions and configurations
│   ├── supabaseClient.ts # Supabase client
│   ├── session.ts       # Session utilities
│   └── utils.ts         # General utilities
├── types/                # TypeScript type definitions
└── public/              # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Authentication

The app uses NextAuth.js for authentication. Users can register and login with email/password. Role-based access control is implemented with 'user' and 'admin' roles.

### Creating an Admin User

After setting up your database, you can create an admin user by directly inserting into the users table or by modifying a user's role:

```sql
-- Make a user an admin
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Shopping Cart

The app includes a complete shopping cart system with:

- **Cart Management**: Add, remove, and update item quantities
- **Persistent Cart**: Cart contents saved in localStorage
- **Cart Drawer**: Slide-out cart for easy access
- **Checkout Flow**: Complete checkout process with form validation
- **Payment Integration**: Stripe payment processing
- **Success Page**: Order confirmation and receipt

### Shopping Routes

- `/shop` - Product catalog and shopping page
- `/checkout` - Checkout form and payment processing
- `/success` - Payment success confirmation

## Admin Panel

Access the admin panel at `/admin` (requires admin role). The admin panel includes:

- Dashboard with key metrics
- User management
- Site configuration
- Settings

## Payments (Stripe)

Stripe integration is included for handling payments and subscriptions. To enable:

1. Create a Stripe account
2. Add your Stripe keys to `.env.local`
3. Set up webhooks for subscription events

## File Uploads (Cloudinary)

File uploads are handled through Cloudinary. To enable:

1. Create a Cloudinary account
2. Add your Cloudinary credentials to `.env.local`
3. Use the upload API endpoint for file uploads

## Deployment

### Environment Variables

Make sure to set all environment variables in your deployment platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXTAUTH_URL` (your production domain)
- `NEXTAUTH_SECRET`

### Database

Ensure your production Supabase database has the same schema as your development database.

## Customization

### Styling

The app uses Tailwind CSS with shadcn/ui components. Customize the theme in `tailwind.config.js` and `app/globals.css`.

### Adding New Features

- Add new API routes in `app/api/`
- Add new pages in `app/`
- Add new components in `components/`
- Update types in `types/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.