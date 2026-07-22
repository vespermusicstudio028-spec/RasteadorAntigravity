import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { supabase } from './_lib/supabase';
import { getPublicKey } from './_lib/vapid';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Configured in vercel.json to run every minute
    // CRON request needs authentication? Vercel secures it via Authorization header automatically if configured
    // Vercel Cron sends a Bearer token in development, you can check it. But let's keep it simple.

    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        // return res.status(401).end('Unauthorized'); // Commented out for local testing, can be re-enabled if CRON_SECRET is set
    }

    try {
        await getPublicKey(); // Initialize VAPID details

        const { data: accounts, error: errA } = await supabase.from('accounts').select('*');
        if (errA || !accounts) throw errA;

        const { data: subscriptions, error: errS } = await supabase.from('subscriptions').select('*');
        if (errS || !subscriptions) throw errS;

        const now = new Date().getTime();

        for (const account of accounts) {
            const targetTime = new Date(account.target_date).getTime();
            const timeDiffMs = targetTime - now;
            const timeDiffMin = timeDiffMs / (1000 * 60);

            let updated = false;

            // 5 minute reminder
            if (timeDiffMin <= 5 && timeDiffMin > 0 && !account.reminder_10_min_sent) {
                account.reminder_10_min_sent = true;
                updated = true;
                await broadcastPush(subscriptions, {
                    title: 'Faltam 5 minutos! ⏳',
                    body: `Prepare-se! O e-mail ${account.email} estará recarregado e pronto para uso em apenas 5 minutos.`,
                });
            }

            // Ready reminder
            if (timeDiffMin <= 0 && !account.ready_sent) {
                account.ready_sent = true;
                updated = true;
                await broadcastPush(subscriptions, {
                    title: 'IA Recarregada! ⚡',
                    body: `O e-mail ${account.email} está totalmente recarregado e já pode ser usado agora mesmo!`,
                });
            }

            if (updated) {
                await supabase
                    .from('accounts')
                    .update({
                        reminder_10_min_sent: account.reminder_10_min_sent,
                        ready_sent: account.ready_sent
                    })
                    .eq('id', account.id);
            }
        }

        res.json({ success: true, processed: accounts.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error while processing cron' });
    }
}

async function broadcastPush(subscriptions: any[], payload: any) {
    for (const sub of subscriptions) {
        try {
            await webpush.sendNotification(sub.subscription_data, JSON.stringify(payload));
        } catch (error: any) {
            if (error.statusCode === 404 || error.statusCode === 410) {
                console.log('Subscription expired: ', error);
                await supabase.from('subscriptions').delete().eq('endpoint', sub.endpoint);
            }
        }
    }
}
