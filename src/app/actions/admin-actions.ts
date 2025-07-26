
'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod';
import { startOfMonth, endOfMonth, startOfYesterday, endOfYesterday, subMonths } from 'date-fns';

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

    if (!supabaseUrl || !supabaseServiceKey) {
        // In a production environment, you might want to log this error.
        // For the self-hosted app, returning null or an empty structure is graceful.
        console.warn("Supabase environment variables are not set. Skipping Supabase client creation.");
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
    if (!supabase) throw new Error('Supabase client is not configured.');

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
    monthlySubCount: number;
    yearlySubCount: number;
    totalIncomeThisMonth: string;
    netProfitThisMonth: string;
    nextMonthEstimated: string;
    lastMonthMonthlyIncome: string;
    lastMonthYearlyIncome: string;
    lastMonthTotalIncome: string;
};

const defaultMetrics: DashboardMetrics = {
    monthlySubCount: 0,
    yearlySubCount: 0,
    totalIncomeThisMonth: '0.00',
    netProfitThisMonth: '0.00',
    nextMonthEstimated: '0.00',
    lastMonthMonthlyIncome: '0.00',
    lastMonthYearlyIncome: '0.00',
    lastMonthTotalIncome: '0.00',
};

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
     const supabase = createSupabaseClient();
     if (!supabase) {
        console.warn("Supabase not configured. Returning default dashboard metrics.");
        return defaultMetrics;
     }

    const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*');

    if (error) {
        console.error("Error fetching subscriptions for metrics:", error);
        throw new Error("Could not load subscription data.");
    }
    
    if (!subscriptions) {
        return defaultMetrics;
    }

    const now = new Date();
    const startOfThisMonth = startOfMonth(now);
    
    const activeMonthlySubs = subscriptions.filter(s => s.plan === 'monthly' && s.status === 'active');
    const activeYearlySubs = subscriptions.filter(s => s.plan === 'yearly' && s.status === 'active');
    
    const nextMonthEstimated = activeMonthlySubs.length * MONTHLY_PRICE;

    const newYearlySubsThisMonth = subscriptions.filter(s => 
        s.plan === 'yearly' &&
        new Date(s.start_date) >= startOfThisMonth &&
        new Date(s.start_date) <= now
    );

    const monthlyIncomeThisMonth = activeMonthlySubs.length * MONTHLY_PRICE;
    const yearlyIncomeThisMonth = newYearlySubsThisMonth.length * YEARLY_PRICE;
    const totalIncomeThisMonth = monthlyIncomeThisMonth + yearlyIncomeThisMonth;
    const netProfitThisMonth = totalIncomeThisMonth; 

    const lastMonthDate = subMonths(now, 1);
    const startOfLastMonth = startOfMonth(lastMonthDate);
    const endOfLastMonth = endOfMonth(lastMonthDate);

    const monthlySubsPaidLastMonth = subscriptions.filter(s => {
        const startDate = new Date(s.start_date);
        return s.plan === 'monthly' && startDate >= startOfLastMonth && startDate <= endOfLastMonth;
    });

    const yearlySubsPaidLastMonth = subscriptions.filter(s => {
        const startDate = new Date(s.start_date);
        return s.plan === 'yearly' && startDate >= startOfLastMonth && startDate <= endOfLastMonth;
    });

    const lastMonthMonthlyIncome = monthlySubsPaidLastMonth.length * MONTHLY_PRICE;
    const lastMonthYearlyIncome = yearlySubsPaidLastMonth.length * YEARLY_PRICE;
    const lastMonthTotalIncome = lastMonthMonthlyIncome + lastMonthYearlyIncome;

    return {
        monthlySubCount: activeMonthlySubs.length,
        yearlySubCount: activeYearlySubs.length,
        totalIncomeThisMonth: totalIncomeThisMonth.toFixed(2),
        netProfitThisMonth: netProfitThisMonth.toFixed(2),
        nextMonthEstimated: nextMonthEstimated.toFixed(2),
        lastMonthMonthlyIncome: lastMonthMonthlyIncome.toFixed(2),
        lastMonthYearlyIncome: lastMonthYearlyIncome.toFixed(2),
        lastMonthTotalIncome: lastMonthTotalIncome.toFixed(2),
    };
}
