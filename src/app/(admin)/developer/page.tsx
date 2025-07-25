
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import { Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function DeveloperPage() {
    
    const steps = [
        {
            title: "Prerequisites",
            items: [
                "**Node.js**: Make sure you have Node.js (version 18 or newer) installed. You can download it from [nodejs.org](https://nodejs.org/).",
                "**Visual Studio Code**: This project is built for VS Code, not Visual Studio 2022. You can download it for free from [code.visualstudio.com](https://code.visualstudio.com/)."
            ]
        },
        {
            title: "Step 1: Set Up Your Local Project Folder",
            items: [
                "Create a new folder on your computer for the project. For example: `C:\\dev\\the-avarian-app` or `~/dev/the-avarian-app`.",
                "Open Visual Studio Code.",
                "Go to `File` > `Open Folder...` and select the folder you just created."
            ]
        },
        {
            title: "Step 2: Create the Project Files",
            items: [
                 "You will need to manually recreate the project structure. Use the VS Code file explorer to create each folder and file.",
                 "The 'File Dump' I've provided contains the full path and content for every file you need to create.",
                 "For example, for the file `/src/app/page.tsx`, you would first create the `src` folder, then the `app` folder inside `src`, and finally the `page.tsx` file inside `app`.",
                 "Copy and paste the exact content from the file dump into each corresponding file you create. This is the most critical step."
            ]
        },
        {
            title: "Step 3: Install Dependencies",
            items: [
                "Once all files are created and saved, open the VS Code terminal (`View` > `Terminal`).",
                "Run the following command to install all the necessary packages defined in `package.json`:",
                "```bash\nnpm install\n```",
                "This will create a `node_modules` folder and a `package-lock.json` file. This might take a few minutes."
            ]
        },
        {
            title: "Step 4: Run the Application",
            items: [
                "After the installation is complete, run the development server:",
                "```bash\nnpm run dev\n```",
                "Open your web browser and navigate to `http://localhost:9002`. You should see the application running locally!"
            ]
        },
         {
            title: "Step 5 (Optional): Push to GitHub",
            items: [
                "Once your local project is working, you can follow the instructions on the official [GitHub Docs](https://docs.github.com/en/get-started/importing-your-projects-to-github/importing-source-code-to-github/adding-locally-hosted-code-to-github) to publish your local repository."
            ]
        }
    ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Developer Setup</h1>
        <p className="text-muted-foreground mt-2">Get the project running on your local machine.</p>
      </div>
      
      <div className="space-y-8">
        <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Important Note</AlertTitle>
            <AlertDescription>
                There is no automatic "zip and download" feature. You must manually create the files on your computer using the complete source code provided to you in the chat.
            </AlertDescription>
        </Alert>

        <Card>
            <CardHeader>
                <CardTitle>Local Setup Instructions</CardTitle>
                <CardDescription>Follow these steps carefully to ensure the project runs correctly.</CardDescription>
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
