import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).end();
    try {
        const { accounts } = req.body;
        if (!Array.isArray(accounts)) {
            return res.status(400).json({ error: 'Invalid payload: expected { accounts: [...] }' });
        }

        for (const acc of accounts) {
            const id = acc.id || uuidv4();
            await setDoc(doc(db, 'accounts', id), {
                id,
                email: acc.email || 'imported@example.com',
                targetDate: acc.targetDate || new Date().toISOString(),
                reminder10MinSent: acc.reminder10MinSent ?? false,
                readySent: acc.readySent ?? false,
            });
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to restore backup' });
    }
}
