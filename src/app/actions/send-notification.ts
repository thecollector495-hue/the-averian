
'use server';

import webPush from 'web-push';
import fs from 'fs/promises';
import path from 'path';

// This is a placeholder for a real database.
const subscriptionsFilePath = path.join(process.cwd(), 'subscriptions.json');

// Ensure VAPID keys are set
if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
  console.warn('VAPID keys are not set. Push notifications will not work.');
} else {
    webPush.setVapidDetails(
        process.env.VAPID_SUBJECT,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

async function getSubscriptions(): Promise<webPush.PushSubscription[]> {
  try {
    const data = await fs.readFile(subscriptionsFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, so no subscriptions yet.
      return [];
    }
    console.error('Error reading subscriptions:', error);
    return [];
  }
}

async function saveSubscriptions(subscriptions: webPush.PushSubscription[]): Promise<void> {
  try {
    await fs.writeFile(subscriptionsFilePath, JSON.stringify(subscriptions, null, 2));
  } catch (error) {
    console.error('Error saving subscriptions:', error);
  }
}

export async function saveSubscription(subscription: webPush.PushSubscription) {
  const subscriptions = await getSubscriptions();
  // Avoid duplicates
  if (!subscriptions.some(s => s.endpoint === subscription.endpoint)) {
    subscriptions.push(subscription);
    await saveSubscriptions(subscriptions);
  }
}

export async function removeSubscription(subscription: webPush.PushSubscription) {
  let subscriptions = await getSubscriptions();
  subscriptions = subscriptions.filter(s => s.endpoint !== subscription.endpoint);
  await saveSubscriptions(subscriptions);
}

export async function sendNotificationToAll(payload: string) {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        throw new Error('VAPID keys not configured.');
    }
  
    const subscriptions = await getSubscriptions();
    const notificationPromises = subscriptions.map(subscription =>
        webPush.sendNotification(subscription, payload).catch(error => {
            // Handle specific errors, e.g., if a subscription is no longer valid (410 Gone)
            if (error.statusCode === 410) {
                console.log(`Subscription expired or invalid for endpoint: ${subscription.endpoint}. Removing.`);
                removeSubscription(subscription);
            } else {
                console.error('Error sending notification to an endpoint:', error);
            }
        })
    );

    await Promise.all(notificationPromises);
}

export async function sendTestNotification() {
    const payload = JSON.stringify({
        title: 'Test Notification',
        body: 'If you received this, your push notifications are working!',
        icon: '/icons/icon-192x192.png' // Make sure you have an icon here
    });
    await sendNotificationToAll(payload);
}
