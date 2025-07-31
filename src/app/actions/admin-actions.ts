
'use server';

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod';
import { startOfMonth, startOfToday, subMonths, endOfMonth } from 'date-fns';

const payfastSettingsSchema = z.object({
    userId: z.string(),
    merchantId: z.string().min(1, 'Merchant ID is required'),
    merchantKey: z.string().min(1, 'Merchant Key is required'),
});

const MONTHLY_PRICE = 35;
const YEARLY_PRICE = 300;

function createSupabaseClient() {
    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('YOUR_SUPABASE_URL')) {
        console.warn("Supabase is not configured. Metrics will be zero.");
        return null;
    }

    return createServerClient(
        supabaseUrl,
        supabaseServiceKey,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    );
}


export async function savePayfastSettings(input: z.infer<typeof payfastSettingsSchema>) {
    const validatedInput = payfastSettingsSchema.parse(input);

    const supabase = createSupabaseClient();
    if (!supabase) throw new Error('Supabase is not configured. Please add your API keys to the .env.local file to save settings.');

    const { data, error } = await supabase
        .from('payfast_settings')
        .upsert({
            user_id: validatedInput.userId,
            merchant_id: validatedInput.merchantId,
            merchant_key: validatedInput.merchantKey,
        }, { onConflict: 'user_id' })
        .select();

    if (error) {
        console.error('Error saving payfast settings:', error);
        throw new Error('Could not save Payfast settings to the database.');
    }

    return data;
}

export async function getPayfastSettings() {
    const supabase = createSupabaseClient();
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const { data, error } = await supabase
        .from('payfast_settings')
        .select('merchant_id, merchant_key')
        .eq('user_id', user.id)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found, which is fine
        console.error('Error fetching payfast settings:', error);
        return null;
    }

    return data;
}

export type DashboardMetrics = {
    freeUserCount: number;
    subscribedUserCount: number;
    totalUserCount: number;
    estimatedMonthlyIncome: string;
    newUsersThisMonth: number;
    newUsersToday: number;
};

// This function calculates metrics from a given list of users.
function calculateMetrics(users: any[]): DashboardMetrics {
    const now = new Date();
    const startOfThisMonth = startOfMonth(now);
    const startOfThisDay = startOfToday();
    
    const freeUserCount = users.filter(u => u.user_metadata?.subscription_status === 'trial' || u.user_metadata?.subscription_status === 'expired' || !u.user_metadata?.subscription_status).length;
    const monthlySubCount = users.filter(u => u.user_metadata?.subscription_status === 'monthly').length;
    const yearlySubCount = users.filter(u => u.user_metadata?.subscription_status === 'yearly').length;

    const subscribedUserCount = monthlySubCount + yearlySubCount;
    const totalUserCount = users.length;
    
    // Yearly price is divided by 12 to get a monthly estimate
    const estimatedMonthlyIncome = (monthlySubCount * MONTHLY_PRICE) + (yearlySubCount * YEARLY_PRICE / 12);
    
    const newUsersThisMonth = users.filter(u => new Date(u.created_at) >= startOfThisMonth).length;
    const newUsersToday = users.filter(u => new Date(u.created_at) >= startOfThisDay).length;

    return {
        freeUserCount,
        subscribedUserCount,
        totalUserCount,
        estimatedMonthlyIncome: estimatedMonthlyIncome.toFixed(2),
        newUsersThisMonth,
        newUsersToday,
    };
}


export async function getDashboardMetrics(): Promise<DashboardMetrics> {
     const supabase = createSupabaseClient();
     const zeroMetrics: DashboardMetrics = {
         freeUserCount: 0,
         subscribedUserCount: 0,
         totalUserCount: 0,
         estimatedMonthlyIncome: '0.00',
         newUsersThisMonth: 0,
         newUsersToday: 0,
     };

     if (!supabase) {
        console.warn("Supabase not configured. Returning zeroed metrics.");
        return zeroMetrics;
     }

    // Supabase returns a max of 50 users by default from auth.admin.listUsers().
    // We need to paginate to get all of them.
    let allUsers = [];
    let page = 0;
    const pageSize = 1000; // Max page size
    let hasMore = true;

    while(hasMore) {
        const { data: { users }, error } = await supabase.auth.admin.listUsers({
            page: page,
            perPage: pageSize,
        });

        if (error) {
            console.error("Error fetching users for metrics:", error);
            throw new Error("Could not load user data.");
        }

        if (users.length > 0) {
            allUsers.push(...users);
            page++;
        } else {
            hasMore = false;
        }
    }
    
    if (!allUsers) {
        return zeroMetrics;
    }

    return calculateMetrics(allUsers);
}
