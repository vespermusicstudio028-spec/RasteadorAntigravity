import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).end();
    try {
        const subscription = req.body;

        // Check if endpoint exists
        const { data: existing, error: searchError } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('endpoint', subscription.endpoint)
            .maybeSingle();

        if (searchError) throw searchError;

        if (!existing) {
            const { error: insertError } = await supabase
                .from('subscriptions')
                .insert({
                    endpoint: subscription.endpoint,
                    subscription_data: subscription
                });
            if (insertError) throw insertError;
        }

        res.status(201).json({});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
}
