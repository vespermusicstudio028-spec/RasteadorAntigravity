import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../_lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const supabase = getSupabase();

        // GET /api/accounts — lista todas as contas
        if (req.method === 'GET') {
            const { data: accounts, error } = await supabase.from('accounts').select('*');
            if (error) throw error;

            const mappedAccounts = (accounts || []).map(acc => ({
                id: acc.id,
                email: acc.email,
                link: acc.link || '',
                targetDate: acc.target_date,
                reminder10MinSent: acc.reminder_10_min_sent,
                readySent: acc.ready_sent,
                createdAt: acc.created_at
            }));
            return res.json(mappedAccounts);
        }

        // POST /api/accounts — cria novo rastreador
        if (req.method === 'POST') {
            const { email, link, targetDate } = req.body;
            const id = uuidv4();
            const newAccount = {
                id,
                email,
                link: link ? String(link).trim() : null,
                target_date: targetDate,
                reminder_10_min_sent: false,
                ready_sent: false
            };

            const { error } = await supabase.from('accounts').insert(newAccount);
            if (error) throw error;

            return res.status(201).json({
                id: newAccount.id,
                email: newAccount.email,
                link: newAccount.link || '',
                targetDate: newAccount.target_date,
                reminder10MinSent: newAccount.reminder_10_min_sent,
                readySent: newAccount.ready_sent
            });
        }

        // DELETE /api/accounts — limpa tudo
        if (req.method === 'DELETE') {
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
