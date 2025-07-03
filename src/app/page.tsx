import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Feather } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 sm:p-6 md:p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Feather className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-headline">Feathered Ledger</h1>
        <p className="mt-2 text-lg text-muted-foreground">Welcome to your personal finance dashboard.</p>
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Your financial summary will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
