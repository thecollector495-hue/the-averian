
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Github, Download } from 'lucide-react';

export default function DeveloperPage() {
    
    const steps = [
        {
            title: "Prerequisites",
            items: [
                "**Node.js**: Make sure you have Node.js (version 18 or newer) installed. You can download it from [nodejs.org](https://nodejs.org/).",
                "**Git**: You need Git to clone the repository. Download it from [git-scm.com](https://git-scm.com/).",
                "**Visual Studio Code**: While you can use any editor, these instructions are for VS Code. Download it from [code.visualstudio.com](https://code.visualstudio.com/)."
            ]
        },
        {
            title: "Step 1: Get the Source Code",
            items: [
                "Clone the repository from GitHub using the following command in your terminal:",
                "```bash\ngit clone https://github.com/your-username/feathered-ledger.git\n```",
                "Navigate into the project directory:",
                "```bash\ncd feathered-ledger\n```"
            ]
        },
        {
            title: "Step 2: Install Dependencies",
            items: [
                "Open the project in Visual Studio Code.",
                "Open the built-in terminal in VS Code (`View` > `Terminal`).",
                "Run the following command to install all the necessary packages:",
                "```bash\nnpm install\n```"
            ]
        },
        {
            title: "Step 3: Set Up Environment Variables",
            items: [
                "In the root of the project, create a new file named `.env`.",
                "Copy the contents of the `.env.example` file (if one exists) or add the necessary keys. For this project, you need VAPID keys for push notifications. You can generate them online or use a tool. For local testing, the file can look like this:",
                "```\nNEXT_PUBLIC_VAPID_PUBLIC_KEY=YourPublicKeyHere\nVAPID_PRIVATE_KEY=YourPrivateKeyHere\nVAPID_SUBJECT=mailto:your-email@example.com\n```"
            ]
        },
        {
            title: "Step 4: Run the Application",
            items: [
                "In the VS Code terminal, run the development server:",
                "```bash\nnpm run dev\n```",
                "The application should now be running locally. Open your browser and go to `http://localhost:9002` to see it."
            ]
        }
    ];

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Developer Zone</h1>
        <p className="text-muted-foreground">Access source code and setup instructions.</p>
      </div>
      
      <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Source Code</CardTitle>
                <CardDescription>This application is open-source. You can view, clone, or download the complete source code from the GitHub repository.</CardDescription>
            </CardHeader>
            <CardContent>
                <a href="https://github.com/your-username/feathered-ledger" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full">
                        <Github className="mr-2 h-4 w-4" />
                        View on GitHub
                    </Button>
                </a>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Local Setup Instructions</CardTitle>
                <CardDescription>Follow these steps to get a copy of the project up and running on your local machine for development and testing purposes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {steps.map((step, index) => (
                    <div key={index}>
                        <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                            {step.items.map((item, itemIndex) => {
                                if (item.startsWith('```')) {
                                    const code = item.replace(/```(bash\n|```)/g, '');
                                    return (
                                        <pre key={itemIndex} className="bg-muted p-3 rounded-md text-sm text-foreground my-2 overflow-x-auto">
                                            <code>{code}</code>
                                        </pre>
                                    );
                                }
                                const formattedItem = item.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                                return <li key={itemIndex} dangerouslySetInnerHTML={{ __html: formattedItem }} />;
                            })}
                        </ul>
                    </div>
                ))}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
