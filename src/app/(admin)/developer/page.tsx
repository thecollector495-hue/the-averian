
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, ExternalLink, Globe } from 'lucide-react';
import Link from 'next/link';

export default function DeveloperPage() {
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
              <h3 className="font-semibold text-lg mb-2">Step 5: Run the Development Server</h3>
              <p>Once the installation is complete, start the local development server:</p>
              <pre className="bg-muted p-3 rounded-md"><code>npm run dev</code></pre>
              <p>The application should now be running! You can view it by opening your web browser and navigating to <Link href="http://localhost:9002" target="_blank" className="text-primary underline">http://localhost:9002</Link>.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="h-6 w-6" /> Hosting Recommendations</CardTitle>
            <CardDescription>Once your app is on GitHub, you can easily deploy it for free using one of these recommended services.</CardDescription>
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
                <h3 className="font-semibold">Firebase Hosting</h3>
                <p className="text-muted-foreground text-sm mb-2">A great choice if you plan to use other Firebase services. Deployment is handled via the Firebase CLI and is well-integrated with the ecosystem.</p>
                 <Button asChild variant="outline" size="sm">
                    <Link href="https://firebase.google.com/docs/hosting" target="_blank">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Learn about Firebase Hosting
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
