# The Averian - Aviary Management App

This is a Next.js application built in Firebase Studio, designed for modern aviary management.

## Getting Started

To run this project locally, you will need to have Node.js and npm (or yarn/pnpm) installed.

### 1. Install Dependencies

In your terminal, run the following command to install the necessary packages:

```bash
npm install
```

### 2. Set Up Environment Variables

This project requires a Supabase backend for user authentication and data storage.

- Create a new project on [Supabase](https://supabase.com/).
- Go to your project's **Settings > API**.
- Create a file named `.env` in the root of your project.
- Copy your **Project URL** and **anon public** key into the `.env` file like this:

```
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

- **Important:** After a user signs up, you must run the SQL scripts provided by the AI assistant to set up the database tables and seed initial data.

### 3. Run the Development Server

Once the dependencies and environment variables are set up, you can start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002).

## How to Set Up a New GitHub Repository

Follow these steps to push your code to a new repository on GitHub.

### Step 1: Create a New Repository on GitHub

1.  Go to [GitHub.com](https://github.com) and log in.
2.  Click the **+** icon in the top-right corner and select **New repository**.
3.  Give your repository a name (e.g., `the-averian-app`).
4.  Choose whether you want it to be public or private.
5.  **Important:** Do **not** initialize the repository with a README, .gitignore, or license file. It should be completely empty.
6.  Click **Create repository**.

### Step 2: Push Your Code from Your Development Environment

On the next page, GitHub will show you a repository URL. It will look something like this: `https://github.com/your-username/your-repo-name.git`.

Now, in the terminal of your development environment, run the following commands one by one. Replace `YOUR_GITHUB_REPO_URL` with the URL you just copied.

```bash
# Initialize a new Git repository in your project folder
git init -b main

# Add all your files to be tracked by Git
git add .

# Create your first commit (a snapshot of your code)
git commit -m "Initial commit"

# Connect your local repository to the one on GitHub
git remote add origin YOUR_GITHUB_REPO_URL

# Push your code to GitHub
git push -u origin main
```

That's it! If you refresh your GitHub page, you will see all your application code there.
