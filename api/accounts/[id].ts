import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { id } = req.query as { id: string };
    try {
        // PUT /api/accounts/:id — atualiza data alvo
        if (req.method === 'PUT') {
            const { targetDate } = req.body;
            await updateDoc(doc(db, 'accounts', id), {
                targetDate,
                reminder10MinSent: false,
                readySent: false,
            });
            const updated = await getDoc(doc(db, 'accounts', id));
            return res.json({ id: updated.id, ...updated.data() });
        }

        // DELETE /api/accounts/:id — deleta conta
        if (req.method === 'DELETE') {
            await deleteDoc(doc(db, 'accounts', id));
            return res.json({ success: true });
        }

        res.status(405).end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
