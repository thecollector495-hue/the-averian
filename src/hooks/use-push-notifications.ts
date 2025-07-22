
'use client';

import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { saveSubscription, removeSubscription, sendTestNotification as sendTestNotificationAction } from '@/app/actions/send-notification';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscriptionLoading, setSubscriptionLoading] = useState(true);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          setServiceWorkerRegistration(registration);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!serviceWorkerRegistration) return;
      try {
        const subscription = await serviceWorkerRegistration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error('Error checking for push subscription:', error);
      } finally {
        setSubscriptionLoading(false);
      }
    };
    checkSubscription();
  }, [serviceWorkerRegistration]);

  const handleSubscriptionChange = async () => {
    if (!serviceWorkerRegistration || !VAPID_PUBLIC_KEY) {
      toast({
        variant: 'destructive',
        title: 'Notifications Not Supported',
        description: 'Your browser or the app configuration does not support push notifications.',
      });
      return;
    }

    if (Notification.permission === 'denied') {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'You have blocked notifications. Please enable them in your browser settings.',
      });
      return;
    }

    setSubscriptionLoading(true);

    if (isSubscribed) {
      // Unsubscribe
      try {
        const subscription = await serviceWorkerRegistration.pushManager.getSubscription();
        if (subscription) {
          await removeSubscription(subscription);
          await subscription.unsubscribe();
        }
        setIsSubscribed(false);
        toast({ title: 'Unsubscribed', description: 'You will no longer receive notifications.' });
      } catch (error) {
        console.error('Failed to unsubscribe:', error);
        toast({ variant: 'destructive', title: 'Unsubscription Failed' });
      } finally {
        setSubscriptionLoading(false);
      }
    } else {
      // Subscribe
      try {
        const subscription = await serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        
        await saveSubscription(subscription);

        setIsSubscribed(true);
        toast({ title: 'Subscribed!', description: 'You will now receive notifications.' });
      } catch (error) {
        console.error('Failed to subscribe:', error);
        toast({ variant: 'destructive', title: 'Subscription Failed', description: (error as Error).message });
      } finally {
        setSubscriptionLoading(false);
      }
    }
  };
  
  const sendTestNotification = async () => {
     if (!serviceWorkerRegistration || !isSubscribed) {
        toast({
            variant: 'destructive',
            title: 'Not Subscribed',
            description: 'You must be subscribed to receive test notifications.'
        });
        return;
    }
    try {
        await sendTestNotificationAction();
        toast({
            title: 'Test Notification Sent',
            description: 'You should receive a notification shortly.'
        });
    } catch (error) {
        console.error('Failed to send test notification:', error);
        toast({
            variant: 'destructive',
            title: 'Failed to Send',
            description: 'Could not send the test notification.'
        });
    }
  }

  return {
    isSubscribed,
    isSubscriptionLoading,
    handleSubscriptionChange,
    sendTestNotification,
  };
}
