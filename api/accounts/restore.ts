import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).end();
    try {
        const { accounts } = req.body;
        if (!Array.isArray(accounts)) {
            return res.status(400).json({ error: 'Invalid payload: expected { accounts: [...] }' });
        }

        const payload = accounts.map(acc => ({
            id: acc.id || uuidv4(),
            email: acc.email || 'imported@example.com',
            target_date: acc.targetDate || new Date().toISOString(),
            reminder_10_min_sent: acc.reminder10MinSent ?? false,
            ready_sent: acc.readySent ?? false,
        }));

        const { error } = await supabase.from('accounts').upsert(payload);
        if (error) throw error;

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to restore backup' });
    }
}
