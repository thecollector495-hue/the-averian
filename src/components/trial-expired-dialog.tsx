
'use client';

import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from './ui/button';
import { Crown } from 'lucide-react';

export function TrialExpiredDialog({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();

  const handleGoToSubscription = () => {
    router.push('/additional/settings');
    // Note: You might want to pass a query param or state to auto-select the 'subscription' tab
    onOpenChange(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Your Free Trial Has Expired</AlertDialogTitle>
          <AlertDialogDescription>
            Your 7-day free trial has ended. You can still view all your data, but you won't be able to add, edit, or delete items. Please subscribe to regain full access.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Maybe Later</AlertDialogCancel>
          <Button onClick={handleGoToSubscription}>
            <Crown className="mr-2 h-4 w-4" />
            Go to Subscription
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
