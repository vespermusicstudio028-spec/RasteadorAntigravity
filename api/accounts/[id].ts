import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { id } = req.query as { id: string };
    try {
        // PUT /api/accounts/:id — atualiza data alvo
        if (req.method === 'PUT') {
            const { targetDate } = req.body;
            const { data, error } = await supabase
                .from('accounts')
                .update({
                    target_date: targetDate,
                    reminder_10_min_sent: false,
                    ready_sent: false,
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return res.json({
                id: data.id,
                email: data.email,
                targetDate: data.target_date,
                reminder10MinSent: data.reminder_10_min_sent,
                readySent: data.ready_sent
            });
        }

        // DELETE /api/accounts/:id — deleta conta
        if (req.method === 'DELETE') {
            const { error } = await supabase.from('accounts').delete().eq('id', id);
            if (error) throw error;
            return res.json({ success: true });
        }

        res.status(405).end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
