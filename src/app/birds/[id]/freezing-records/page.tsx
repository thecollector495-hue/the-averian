
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function FreezingRecordsPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-4 sm:p-6 md:p-8">
       <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="outline" size="icon">
           <Link href="/">
              <ArrowLeft />
              <span className="sr-only">Back to Birds</span>
           </Link>
        </Button>
        <h1 className="text-3xl font-bold">Freezing Records for Bird #{params.id}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Freezing Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Freezing records for this bird will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
