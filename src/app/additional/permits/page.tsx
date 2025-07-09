
'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ShieldCheck, Trash2 } from "lucide-react";
import { Permit, Bird } from '@/lib/data';
import { format } from 'date-fns';
import { PermitFormValues } from '@/components/add-permit-dialog';
import { useItems } from '@/context/ItemsContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const AddPermitDialog = dynamic(() => import('@/components/add-permit-dialog').then(mod => mod.AddPermitDialog), { ssr: false });

export default function PermitsPage() {
  const { items, addItem, deleteItem, updateItems } = useItems();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deletingPermitId, setDeletingPermitId] = useState<string | null>(null);

  const { permits, allBirds } = useMemo(() => ({
    permits: items.filter((item): item is Permit => item.category === 'Permit'),
    allBirds: items.filter((item): item is Bird => item.category === 'Bird'),
  }), [items]);

  const permitToDelete = useMemo(() => 
    deletingPermitId ? permits.find(p => p.id === deletingPermitId) : null,
    [deletingPermitId, permits]
  );

  const handleSavePermit = (data: PermitFormValues) => {
    const newPermit: Permit = {
      ...data,
      id: `p${Date.now()}`,
      category: 'Permit',
      issueDate: format(data.issueDate, 'yyyy-MM-dd'),
      expiryDate: data.expiryDate ? format(data.expiryDate, 'yyyy-MM-dd') : undefined,
    };
    addItem(newPermit);
    toast({ title: "Permit Added", description: "The new permit has been logged." });
  };
  
  const handleDeletePermit = () => {
    if (!deletingPermitId) return;

    const birdsToUpdate = allBirds
      .filter(bird => bird.permitId === deletingPermitId)
      .map(bird => ({ ...bird, permitId: undefined }));

    if (birdsToUpdate.length > 0) {
      updateItems(birdsToUpdate);
    }

    deleteItem(deletingPermitId);
    toast({ title: 'Permit Deleted', description: 'The permit has been removed.' });
    setDeletingPermitId(null);
  };
  
  return (
    <div className="p-4 sm:p-6 md:p-8">
      {isAddDialogOpen && <AddPermitDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={handleSavePermit}
      />}
      
      <AlertDialog open={!!deletingPermitId} onOpenChange={(open) => !open && setDeletingPermitId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the permit '{permitToDelete?.permitNumber}'. Any birds associated with this permit will no longer be linked to it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePermit}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><ShieldCheck className="text-primary"/>{p.permitNumber}</CardTitle>
                  <CardDescription>{p.issuingAuthority}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setDeletingPermitId(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Delete Permit</span>
                </Button>
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
