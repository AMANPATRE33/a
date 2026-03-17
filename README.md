# Smart Anna - Intelligent Cafeteria Dashboard

> **Smart Anna** is a next-generation cafeteria management system that combines real-time IoT sensor data with a modern digital ordering platform. It is designed to optimize cafeteria operations, reduce overcrowding, and enhance the user experience for both students and administrators.

---

## 🌟 Project Overview & Functionality

This application is a **Hybrid System** that bridges the gap between physical sensors and digital services.

### 1. 🧠 IoT & Sensor Integration (Python Backend)
The system is designed to consume data from a local Python script (`backend/server.py`) that simulates or interfaces with physical hardware:
*   **Real-Time Occupancy**: Tracks how many people are currently inside the cafeteria.
*   **Table Availability**: Monitors specific tables to show which are free or occupied using simulated pressure/IR sensors.
*   **Live Camera Feeds**: Streams CCTV footage (or simulated feeds) to the dashboard for security and crowd monitoring.

### 2. ☁️ Digital Services (Supabase Cloud)
All persistent data and user interactions are handled by **Supabase** (PostgreSQL):
*   **Digital Menu**: A dynamic menu managed by admins, stored in the cloud.
*   **Ordering System**: Students can add items to a cart and place orders. Orders are saved to the database for kitchen processing.
*   **Feedback Loop**: Users can submit ratings and reviews, which are stored and displayed in real-time.
*   **Analytics**: Admins get a dashboard showing total revenue, popular items, and sales trends based on actual order history.

### 3. 👥 User Roles
*   **Student (Guest/User)**: Can view live crowd status, browse the menu, place orders, and submit feedback.
*   **Admin**: Has access to a secured dashboard to manage the menu (add/remove items), view detailed analytics, and monitor security feeds.

---

## 🚀 Deployment Guide (Supabase + Vercel)

Follow these steps to deploy the application live. This guide assumes you have a GitHub account.

### Phase 1: Supabase Setup (The Database)

1.  **Create a Project**:
    *   Go to [Supabase.com](https://supabase.com/) and sign up/log in.
    *   Click **"New Project"**.
    *   Give it a name (e.g., `smart-anna-cafeteria`) and a strong database password.
    *   Choose a region close to you and click **"Create new project"**.

2.  **Get Credentials**:
    *   Once the project is ready (takes ~1-2 mins), go to **Project Settings** (gear icon) -> **API**.
    *   Copy the **Project URL** (`https://...supabase.co`).
    *   Copy the **anon public** key.
    *   *Keep these safe, you will need them for Vercel.*

3.  **Create Tables (SQL Editor)**:
    *   Click on the **SQL Editor** icon (left sidebar).
    *   Click **"New query"**.
    *   Paste the following SQL code and click **"Run"** to set up your database structure:

    ```sql
    -- 1. Create Menu Table
    create table menu_items (
      id uuid default gen_random_uuid() primary key,
      name text not null,
      price numeric not null,
      category text not null,
      image_url text,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- 2. Create Orders Table
    create table orders (
      id uuid default gen_random_uuid() primary key,
      user_email text,
      total numeric not null,
      items jsonb not null, -- Stores the cart items as JSON
      payment_method text,
      status text default 'pending',
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- 3. Create Feedback Table
    create table feedback (
      id uuid default gen_random_uuid() primary key,
      user_name text,
      user_email text,
      rating integer not null,
      message text,
      type text,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- 4. Insert Initial Menu Data (Optional)
    insert into menu_items (name, price, category, image_url) values
    ('Veg Burger', 45, 'Snacks', 'https://images.unsplash.com/photo-1550547660-d9450f859349'),
    ('Cold Coffee', 80, 'Beverages', 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e'),
    ('Chicken Biryani', 150, 'Meals', 'https://images.unsplash.com/photo-1589302168068-964664d93dc0');
    ```

### Phase 2: Vercel Deployment (The Frontend)

1.  **Push to GitHub**:
    *   Ensure your project code is pushed to a GitHub repository.

2.  **Import to Vercel**:
    *   Go to [Vercel.com](https://vercel.com/) and log in.
    *   Click **"Add New..."** -> **"Project"**.
    *   Find your `smart-anna` repository and click **"Import"**.

3.  **Configure Project**:
    *   **Framework Preset**: Select **Vite**.
    *   **Root Directory**: Leave as `./`.
    *   **Build Command**: `npm run build`.
    *   **Output Directory**: `dist`.

4.  **Add Environment Variables**:
    *   Expand the **"Environment Variables"** section.
    *   Add the following keys (using the values you copied from Supabase):
        *   `VITE_SUPABASE_URL` : *Your Supabase Project URL*
        *   `VITE_SUPABASE_ANON_KEY` : *Your Supabase Anon Key*

5.  **Deploy**:
    *   Click **"Deploy"**.
    *   Wait for a minute. Vercel will build your site and give you a live URL (e.g., `https://smart-anna.vercel.app`).

---

## ⚠️ Important Note on Python Backend

The **Live Sensor Data** (Occupancy, Table Status, Camera Feeds) relies on the local Python script (`backend/server.py`).

*   **On Vercel**: The deployed app **cannot** access your local computer's Python script (localhost).
*   **Fallback Mode**: When deployed, the app will automatically detect that the Python API is unreachable and switch to **Simulation Mode** (showing random/mock data for occupancy and tables) so the UI remains functional.
*   **Full Production**: To make the sensors work live on the web, you would need to deploy the Python backend to a service like **Render** or **Railway** and update the `PYTHON_API_URL` in `services/apiService.ts`.

---

## 💻 Local Development

To run the full system locally (Frontend + Backend):

1.  **Start Python Backend**:
    ```bash
    pip install -r backend/requirements.txt
    python backend/server.py
    ```
2.  **Start Frontend**:
    ```bash
    # Create .env file with your Supabase keys first!
    npm install
    npm run dev
    ```

---

## 🛠️ Troubleshooting

### Common Deployment Issues

*   **"tsc: Permission denied" or "Command npm run build exited with 126"**:
    *   This happens when Vercel cannot execute the TypeScript compiler.
    *   **Fix**: We have updated the `package.json` to remove `tsc` from the build command. Ensure you push the latest `package.json` to GitHub.
    *   If the error persists, go to Vercel Project Settings > General > Build & Development Settings and override the **Build Command** to: `npm run build` (or `vite build`).

*   **"500 Internal Server Error" on API calls**:
    *   Check your Environment Variables in Vercel. Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct.
    *   Check if your Supabase project is active.

---

## 🆕 Latest Updates (March 2026)

We have recently upgraded **Smart Anna** with several "smart" features to make it more reliable and professional:

1.  **🚀 Smart Demo Mode**: If the internet or database goes down, the app won't crash! It now automatically switches to a "Demo Mode" so you can still see how the menu and ordering look.
2.  **🔒 Better Login Security**: We added a small "Eye" icon to the password entry. Now you can double-check what you're typing before you hit login.
3.  **🎨 New Iconic Branding**: We’ve updated the app with a bold new character logo, a catchy tagline (*"Swift. Smart. Satisfying."*), and official credits for **UPL University**.
4.  **🚧 Transparency on Features**: Features like "Live Feeds" are now clearly marked as **UNDER DEVELOPMENT**. This lets users know we are still perfecting the AI vision parts of the system.
5.  **🍱 Fixed Menu Loading**: We solved a bug where the food menu was showing up blank. It is now perfectly synced with your Supabase cloud database.
6.  **📊 Live Analytics & Revenue Dashboard**: The Admin Revenue Dashboard is now fully wired up to real-time order and feedback data via Supabase. Orders reflect instantly in the system and charts are rock-solid, gracefully handling instances where there is zero activity without crashing.

---
© 2026 • All Rights Reserved to UPL University - BE 8 Project Team 


