
'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import crypto from 'crypto';
import { z } from 'zod';

const createPaymentSchema = z.object({
    userId: z.string(),
    userEmail: z.string().email(),
    plan: z.enum(['monthly', 'yearly']),
    amount: z.number(),
    itemName: z.string(),
    itemDescription: z.string(),
});

function createSupabaseClient() {
    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('YOUR_SUPABASE_URL_HERE')) {
        console.warn("Supabase environment variables are not properly set.");
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

export async function createPayment(input: z.infer<typeof createPaymentSchema>) {
    const validatedInput = createPaymentSchema.parse(input);

    const supabase = createSupabaseClient();
    if (!supabase) throw new Error('Supabase client is not configured. Please set up API keys in .env.local');

    const { data: settings, error: settingsError } = await supabase
        .from('payfast_settings')
        .select('merchant_id, merchant_key')
        .limit(1)
        .single();
    
    if (settingsError || !settings) {
        console.error('Payfast settings not found in DB', settingsError);
        throw new Error('Payfast integration is not configured. Please contact support.');
    }

    const payfastUrl = 'https://sandbox.payfast.co.za/eng/process'; // Use www.payfast.co.za for production

    const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/additional/settings`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/additional/settings`;
    const notifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/payfast/notify`;
    
    const paymentData: { [key: string]: string } = {
        merchant_id: settings.merchant_id,
        merchant_key: settings.merchant_key,
        return_url: returnUrl,
        cancel_url: cancelUrl,
        notify_url: notifyUrl,
        email_address: validatedInput.userEmail,
        m_payment_id: `${validatedInput.plan}-${validatedInput.userId}-${Date.now()}`,
        amount: validatedInput.amount.toFixed(2),
        item_name: validatedInput.itemName,
        item_description: validatedInput.itemDescription,
        custom_str1: validatedInput.userId,
        custom_str2: validatedInput.plan,
    };
    
    let sigString = '';
    for (const key in paymentData) {
        sigString += `${key}=${encodeURIComponent(paymentData[key].trim()).replace(/%20/g, '+')}&`;
    }
    sigString = sigString.slice(0, -1);
    
    const signature = crypto.createHash('md5').update(sigString).digest('hex');
    paymentData['signature'] = signature;
    
    const urlParams = new URLSearchParams(paymentData);
    
    return `${payfastUrl}?${urlParams.toString()}`;
}
