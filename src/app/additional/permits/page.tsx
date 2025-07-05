
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ShieldCheck } from "lucide-react";
import { Permit } from '@/lib/data';
import { format } from 'date-fns';
import { PermitFormValues } from '@/components/add-permit-dialog';
import { useItems } from '@/context/ItemsContext';

const AddPermitDialog = dynamic(() => import('@/components/add-permit-dialog').then(mod => mod.AddPermitDialog), { ssr: false });

export default function PermitsPage() {
  const { items, addItem } = useItems();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const permits = items.filter((item): item is Permit => item.category === 'Permit');

  const handleSavePermit = (data: PermitFormValues) => {
    const newPermit: Permit = {
      ...data,
      id: `p${Date.now()}`,
      category: 'Permit',
      issueDate: format(data.issueDate, 'yyyy-MM-dd'),
      expiryDate: data.expiryDate ? format(data.expiryDate, 'yyyy-MM-dd') : undefined,
    };
    addItem(newPermit);
  };
  
  return (
    <div className="p-4 sm:p-6 md:p-8">
      {isAddDialogOpen && <AddPermitDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={handleSavePermit}
      />}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Permits</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4"/>
          Add Permit
        </Button>
      </div>
       {permits.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {permits.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="text-primary"/>{p.permitNumber}</CardTitle>
                <CardDescription>{p.issuingAuthority}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                    <p><span className="font-medium text-muted-foreground">Issued:</span> {format(new Date(p.issueDate), 'PPP')}</p>
                    <p><span className="font-medium text-muted-foreground">Expires:</span> {p.expiryDate ? format(new Date(p.expiryDate), 'PPP') : 'No expiry'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        ) : (
            <div className="text-center py-16 rounded-lg border border-dashed">
                <h2 className="text-xl font-semibold">No Permits Yet</h2>
                <p className="text-muted-foreground mt-2">Click "Add Permit" to log your first one.</p>
            </div>
        )}
    </div>
  );
}
