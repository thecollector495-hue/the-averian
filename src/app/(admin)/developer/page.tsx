
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, ExternalLink, Globe, Database, BrainCircuit } from 'lucide-react';
import Link from 'next/link';

export default function DeveloperPage() {
  const supabaseSql = `
-- 1. Enable Row Level Security (RLS) on all tables
-- This is a security best practice.
ALTER TABLE birds ENABLE ROW LEVEL SECURITY;
ALTER TABLE cages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_species ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_mutations ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for public read access
-- Allows anyone to read data, but not write it.
-- You can tighten these rules later (e.g., allow only logged-in users).
CREATE POLICY "Public data is viewable by everyone." ON birds FOR SELECT USING (true);
CREATE POLICY "Public data is viewable by everyone." ON cages FOR SELECT USING (true);
CREATE POLICY "Public data is viewable by everyone." ON pairs FOR SELECT USING (true);
CREATE POLICY "Public data is viewable by everyone." ON breeding_records FOR SELECT USING (true);
CREATE POLICY "Public data is viewable by everyone." ON notes FOR SELECT USING (true);
CREATE POLICY "Public data is viewable by everyone." ON transactions FOR SELECT USING (true);
CREATE POLICY "Public data is viewable by everyone." ON permits FOR SELECT USING (true);
CREATE POLICY "Public data is viewable by everyone." ON custom_species FOR SELECT USING (true);
CREATE POLICY "Public data is viewable by everyone." ON custom_mutations FOR SELECT USING (true);

-- 3. Create Payfast Settings table
-- This stores your Payfast merchant credentials.
CREATE TABLE payfast_settings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id TEXT NOT NULL UNIQUE,
  merchant_id TEXT NOT NULL,
  merchant_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE payfast_settings ENABLE ROW LEVEL SECURITY;
-- For this app, only the admin can read/write their own settings.
CREATE POLICY "Admin can manage their own Payfast settings" ON payfast_settings
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- 4. Create Subscriptions table
-- This tracks user subscriptions.
CREATE TABLE subscriptions (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id TEXT NOT NULL UNIQUE,
    plan TEXT NOT NULL,
    status TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    payfast_payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
-- Admin can see all subscriptions
CREATE POLICY "Admin can view all subscriptions" ON subscriptions
  FOR SELECT
  USING (
    (SELECT subscription_status FROM auth.users WHERE id = auth.uid()) = 'admin'
  );
-- Users can see their own subscription
CREATE POLICY "Users can view their own subscription" ON subscriptions
  FOR SELECT
  USING (auth.uid()::text = user_id);
`.trim();

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Developer Guide</h1>
        <p className="text-muted-foreground">Set up the project for local development and self-hosting.</p>
      </div>
      
      <div className="space-y-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Get The Source Code</CardTitle>
            <CardDescription>
              First, you'll need to create your own Git repository and upload the source code. The project code is available on GitHub to clone or download.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
                <Link href="https://github.com/your-username/your-repository-name" target="_blank">
                    <Github className="mr-2 h-4 w-4" />
                    View on GitHub (Replace with your repo link)
                </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Important Note: Visual Studio Code vs. Visual Studio 2022</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>This is a modern web application built with Next.js (a JavaScript/Node.js framework).</p>
            <p className="font-semibold text-foreground">For this project, you must use <span className="text-primary">Visual Studio Code</span>, which is a lightweight but powerful code editor designed for web development. It is the industry standard for JavaScript projects.</p>
            <p>Visual Studio 2022 is a different application (an Integrated Development Environment or IDE) typically used for .NET, C++, and other types of development. It is not the correct tool for this project.</p>
            <Button asChild variant="outline">
                <Link href="https://code.visualstudio.com/download" target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Download Visual Studio Code
                </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Local Setup Instructions</CardTitle>
            <CardDescription>Follow these steps to get the application running on your local machine.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 prose prose-sm dark:prose-invert max-w-none">
            <div>
              <h3 className="font-semibold text-lg mb-2">Step 1: Prerequisites</h3>
              <p>Ensure you have the following software installed:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><Link href="https://nodejs.org/" target="_blank" className="text-primary underline">Node.js</Link> (LTS version recommended)</li>
                <li><Link href="https://code.visualstudio.com/" target="_blank" className="text-primary underline">Visual Studio Code</Link></li>
                <li><Link href="https://git-scm.com/" target="_blank" className="text-primary underline">Git</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Step 2: Get the Code</h3>
              <p>Open your terminal or command prompt and clone the repository from GitHub:</p>
              <pre className="bg-muted p-3 rounded-md overflow-x-auto"><code>git clone https://github.com/your-username/your-repository-name.git</code></pre>
              <p>Navigate into the newly created project folder:</p>
              <pre className="bg-muted p-3 rounded-md"><code>cd your-repository-name</code></pre>
            </div>
             <div>
              <h3 className="font-semibold text-lg mb-2">Step 3: Open in VS Code</h3>
              <p>Open the entire project folder in Visual Studio Code:</p>
              <pre className="bg-muted p-3 rounded-md"><code>code .</code></pre>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Step 4: Install Dependencies</h3>
              <p>Open the integrated terminal in VS Code (View &gt; Terminal) and run this command to install all the necessary packages:</p>
              <pre className="bg-muted p-3 rounded-md"><code>npm install</code></pre>
              <p className="text-xs text-muted-foreground">This command reads the `package.json` file and downloads all the libraries the project needs to run.</p>
            </div>
            <div>
                <h3 className="font-semibold text-lg mb-2">Step 5: Set Up Environment Variables</h3>
                <p>In the root of your project, create a new file named <code className="font-semibold">.env.local</code>. Copy the contents of the existing <code className="font-semibold">.env</code> file into it. You will fill this file with your API keys in the next section.</p>
            </div>
             <div>
              <h3 className="font-semibold text-lg mb-2">Step 6: Run the Development Server</h3>
              <p>Once the installation is complete, start the local development server:</p>
              <pre className="bg-muted p-3 rounded-md"><code>npm run dev</code></pre>
              <p>The application should now be running! You can view it by opening your web browser and navigating to <Link href="http://localhost:9002" target="_blank" className="text-primary underline">http://localhost:9002</Link>.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backend &amp; AI Setup</CardTitle>
            <CardDescription>To use features like data persistence and the AI assistant, you need to connect to external services. This app is designed to work with Supabase and Google Gemini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2"><Database className="h-5 w-5"/> Supabase Setup (Database & Auth)</h3>
              <p className="text-sm text-muted-foreground">Supabase will act as your database to store all the aviary data.</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to <Link href="https://supabase.com/" target="_blank" className="text-primary underline">Supabase</Link> and create a free account and a new project.</li>
                <li>Inside your project, go to the <span className="font-semibold">SQL Editor</span>.</li>
                <li>Click <span className="font-semibold">"+ New query"</span> and paste the SQL code below. Click <span className="font-semibold">"RUN"</span> to create the necessary tables.</li>
                <li>Go to <span className="font-semibold">Project Settings &gt; API</span>. Find your Project URL and the `anon` `public` key.</li>
                <li>Add these to your <code className="font-semibold">.env.local</code> file as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.</li>
              </ol>
               <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs"><code>{supabaseSql}</code></pre>
                 <Button asChild variant="outline" size="sm">
                    <Link href="https://supabase.com" target="_blank">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Go to Supabase
                    </Link>
                </Button>
            </div>
            <div className="space-y-4 pt-4">
              <h3 className="font-semibold text-lg flex items-center gap-2"><BrainCircuit className="h-5 w-5"/> Google AI (Gemini) Setup</h3>
               <p className="text-sm text-muted-foreground">The AI Assistant uses Google's Gemini models.</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to <Link href="https://aistudio.google.com/app/apikey" target="_blank" className="text-primary underline">Google AI Studio</Link>.</li>
                <li>Click <span className="font-semibold">"Create API key"</span> to get your free key.</li>
                <li>Add this key to your <code className="font-semibold">.env.local</code> file as `GEMINI_API_KEY`.</li>
              </ol>
               <Button asChild variant="outline" size="sm">
                    <Link href="https://aistudio.google.com/app/apikey" target="_blank">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Get Gemini API Key
                    </Link>
                </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="h-6 w-6" /> Hosting Recommendations</CardTitle>
            <CardDescription>Once your app is on GitHub and connected to Supabase, you can easily deploy it for free using one of these recommended services.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
                <h3 className="font-semibold">Vercel (Recommended)</h3>
                <p className="text-muted-foreground text-sm mb-2">As the creators of Next.js, Vercel offers the most seamless one-click deployment experience. Simply import your GitHub repository and it will be live in minutes.</p>
                 <Button asChild variant="outline" size="sm">
                    <Link href="https://vercel.com/new" target="_blank">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Deploy on Vercel
                    </Link>
                </Button>
            </div>
             <div>
                <h3 className="font-semibold">Netlify</h3>
                <p className="text-muted-foreground text-sm mb-2">Another excellent, easy-to-use platform with a generous free tier and a great GitHub integration. A strong alternative to Vercel.</p>
                 <Button asChild variant="outline" size="sm">
                    <Link href="https://app.netlify.com/start" target="_blank">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Deploy on Netlify
                    </Link>
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
