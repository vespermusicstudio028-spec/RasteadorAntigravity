import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // GET /api/accounts — lista todas
        if (req.method === 'GET') {
            const { data: accounts, error } = await supabase.from('accounts').select('*');
            if (error) throw error;

            const mappedAccounts = (accounts || []).map(acc => ({
                id: acc.id,
                email: acc.email,
                targetDate: acc.target_date,
                reminder10MinSent: acc.reminder_10_min_sent,
                readySent: acc.ready_sent
            }));
            return res.json(mappedAccounts);
        }

        // POST /api/accounts — cria nova conta
        if (req.method === 'POST') {
            const { email, targetDate } = req.body;
            const id = uuidv4();
            const newAccount = {
                id,
                email,
                target_date: targetDate,
                reminder_10_min_sent: false,
                ready_sent: false
            };

            const { error } = await supabase.from('accounts').insert(newAccount);
            if (error) throw error;

            // Return with original camelCase names to not break frontend immediately, 
            // or frontend expects camelCase. Frontend expects targetDate.
            return res.status(201).json({
                id: newAccount.id,
                email: newAccount.email,
                targetDate: newAccount.target_date,
                reminder10MinSent: newAccount.reminder_10_min_sent,
                readySent: newAccount.ready_sent
            });
        }

        // DELETE /api/accounts — limpa tudo
        if (req.method === 'DELETE') {
            // In Supabase, deleting all rows easily: delete() with neq or just truncate
            const { error } = await supabase.from('accounts').delete().filter('id', 'not.is', null);
            if (error) throw error;
            return res.json({ success: true });
        }

        res.status(405).end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
