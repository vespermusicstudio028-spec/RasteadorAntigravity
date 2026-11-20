import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { id } = req.query as { id: string };
    try {
        const supabase = getSupabase();

        // PUT /api/accounts/:id — atualiza dados do rastreador
        if (req.method === 'PUT') {
            const { targetDate, link, email } = req.body;
            const updatePayload: Record<string, any> = {};

            if (targetDate !== undefined) {
                updatePayload.target_date = targetDate;
                updatePayload.reminder_10_min_sent = false;
                updatePayload.ready_sent = false;
            }
            if (link !== undefined) {
                updatePayload.link = link ? String(link).trim() : null;
            }
            if (email !== undefined) {
                updatePayload.email = email;
            }

            const { data, error } = await supabase
                .from('accounts')
                .update(updatePayload)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return res.json({
                id: data.id,
                email: data.email,
                link: data.link || '',
                targetDate: data.target_date,
                reminder10MinSent: data.reminder_10_min_sent,
                readySent: data.ready_sent,
                createdAt: data.created_at
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
