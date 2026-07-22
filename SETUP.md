# Hamza Dashboard — Setup Guide

## Step 1: Create a Supabase Project (Free)

1. Go to [supabase.com](https://supabase.com) and sign up / sign in
2. Click **"New Project"**
3. Name it `hamza-dashboard`, set a **database password** (save it), pick a region close to you
4. Wait for it to finish setting up (~1 min)

## Step 2: Create the Database Table

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **"New Query"** and paste this entire block:

```sql
-- Create the user_data table
CREATE TABLE IF NOT EXISTS user_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key)
);

-- Enable Row Level Security (so users only see their own data)
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Policy: users can read their own data
CREATE POLICY "Users can read own data" ON user_data
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: users can insert their own data
CREATE POLICY "Users can insert own data" ON user_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: users can update their own data
CREATE POLICY "Users can update own data" ON user_data
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: users can delete their own data
CREATE POLICY "Users can delete own data" ON user_data
  FOR DELETE USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_user_data_user_key ON user_data(user_id, key);
```

3. Click **"Run"** — you should see "Success"

## Step 3: Get Your API Keys

1. Go to **Project Settings** → **API** (left sidebar)
2. Copy these two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon / public key** (the long string under "Project API keys")

## Step 4: Set Up the Project Locally

```bash
# Clone or download this folder, then:
cd hamza-dashboard
npm install

# Create a .env file with your Supabase credentials:
echo "VITE_SUPABASE_URL=your_project_url_here" > .env
echo "VITE_SUPABASE_ANON_KEY=your_anon_key_here" >> .env

# Run locally to test:
npm run dev
```

Open `http://localhost:5173` — you should see the login page.

## Step 5: Create Your Account

1. On the login page, click **"Need an account? Sign up"**
2. Enter your email and a password
3. Check your email and click the confirmation link
4. Sign in — your dashboard should load with all empty modules ready to use

**To disable sign-ups after you create your account:**
Go to Supabase → **Authentication** → **Providers** → **Email** → Turn off "Enable Sign Up"
This locks it to only your account.

## Step 6: Deploy to Vercel (Free)

1. Push this project to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   # Create a repo on github.com, then:
   git remote add origin https://github.com/YOUR_USERNAME/hamza-dashboard.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **"New Project"** → Import your `hamza-dashboard` repo
4. Add **Environment Variables**:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
5. Click **Deploy**

Your dashboard will be live at `https://hamza-dashboard.vercel.app` (or custom domain).

## Step 7: Custom Domain (Optional)

1. In Vercel, go to your project → **Settings** → **Domains**
2. Add your domain (e.g. `dashboard.hamza.com`)
3. Follow the DNS instructions to point your domain to Vercel

## How Data Storage Works

- Every module (habits, tasks, finance, etc.) saves to Supabase automatically
- Data is saved with a 300ms debounce (waits for you to stop typing)
- Each save uses "upsert" — creates if new, updates if existing
- Row Level Security ensures only YOU can see your data
- Data syncs across all your devices (phone, laptop, tablet)
- Data persists forever (until you delete it)

## Troubleshooting

- **Blank page after deploy**: Check browser console for errors. Make sure env vars are set in Vercel.
- **Can't sign in**: Make sure you confirmed your email. Check Supabase Auth logs.
- **Data not saving**: Check browser console for "Save error" messages. Verify the SQL table was created.
