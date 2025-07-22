
export type Subscription = {
  id: string;
  userId: string;
  plan: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired';
  startDate: string; // ISO 8601 date string
  endDate?: string; // ISO 8601 date string
};

// Function to generate a random date within the last year
const getRandomDate = () => {
  const end = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Generate more realistic mock data
const generateMockSubscriptions = (count: number): Subscription[] => {
  const subscriptions: Subscription[] = [];
  for (let i = 1; i <= count; i++) {
    const plan = Math.random() > 0.3 ? 'monthly' : 'yearly';
    const startDate = getRandomDate();
    const status = Math.random() > 0.1 ? 'active' : 'cancelled';
    
    let endDate: string | undefined = undefined;
    if (plan === 'monthly') {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + 1);
      endDate = d.toISOString();
    } else {
      const d = new Date(startDate);
      d.setFullYear(d.getFullYear() + 1);
      endDate = d.toISOString();
    }

    subscriptions.push({
      id: `sub_${i}`,
      userId: `user_${i}`,
      plan,
      status,
      startDate: startDate.toISOString(),
      endDate: status === 'active' ? undefined : endDate,
    });
  }
  return subscriptions;
};

export const mockSubscriptions: Subscription[] = generateMockSubscriptions(150);
