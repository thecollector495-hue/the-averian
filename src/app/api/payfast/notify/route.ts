
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    try {
        const formData = await req.formData();
        const data: { [key: string]: any } = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        // 1. Fetch PayFast settings
        const { data: settings, error: settingsError } = await supabase
            .from('payfast_settings')
            .select('merchant_id, merchant_key')
            .limit(1)
            .single();

        if (settingsError || !settings) {
            console.error('Payfast settings not found in DB', settingsError);
            return new NextResponse('Configuration error', { status: 500 });
        }

        // 2. Validate Origin IP (optional but recommended)
        // Add PayFast IPs here for production
        const validIps = ['127.0.0.1']; 
        const requestIp = req.headers.get('x-forwarded-for') || req.ip;
        // if (process.env.NODE_ENV === 'production' && !validIps.includes(requestIp)) {
        //     console.warn(`Invalid IP trying to access ITN: ${requestIp}`);
        //     return new NextResponse('Forbidden', { status: 403 });
        // }

        // 3. Verify Signature
        let sigString = '';
        for (const key in data) {
            if (key !== 'signature') {
                sigString += `${key}=${encodeURIComponent(data[key].toString().trim()).replace(/%20/g, '+')}&`;
            }
        }
        sigString = sigString.slice(0, -1); // remove last &

        const generatedSignature = crypto.createHash('md5').update(sigString).digest('hex');

        if (generatedSignature !== data.signature) {
            console.warn('Invalid signature received');
            return new NextResponse('Invalid signature', { status: 400 });
        }
        
        // 4. Verify payment data with PayFast server
        const verificationString = new URLSearchParams(data).toString();
        const pfValidateUrl = 'https://sandbox.payfast.co.za/eng/query/validate'; // Use www.payfast.co.za for production

        const response = await fetch(pfValidateUrl, {
            method: 'POST',
            body: verificationString,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const bodyText = await response.text();

        if (bodyText !== 'VALID') {
            console.warn(`Invalid payment data verification: ${bodyText}`);
            return new NextResponse('Invalid payment data', { status: 400 });
        }
        
        // 5. Process Payment
        if (data.payment_status === 'COMPLETE') {
            const userId = data.custom_str1;
            const plan = data.custom_str2;
            const pfPaymentId = data.pf_payment_id;

            const now = new Date();
            let endDate: Date;
            if (plan === 'yearly') {
                endDate = new Date(now.setFullYear(now.getFullYear() + 1));
            } else {
                endDate = new Date(now.setMonth(now.getMonth() + 1));
            }

            const { error: upsertError } = await supabase
                .from('subscriptions')
                .upsert({
                    user_id: userId,
                    plan: plan,
                    status: 'active',
                    start_date: new Date().toISOString(),
                    end_date: endDate.toISOString(),
                    payfast_payment_id: pfPaymentId
                }, { onConflict: 'user_id' });

            if (upsertError) {
                console.error('Error upserting subscription:', upsertError);
                return new NextResponse('Database error', { status: 500 });
            }

            // Also update the user's role in the auth table
            const { error: authUserError } = await supabase.auth.admin.updateUserById(userId, {
                user_metadata: { subscription_status: plan }
            })

            if (authUserError) {
                console.error('Error updating user metadata in auth:', authUserError);
                // Don't fail the whole request, but log it.
            }
        }

        return new NextResponse('OK', { status: 200 });

    } catch (error) {
        console.error('Error in PayFast ITN handler:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
