import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // GET /api/accounts — lista todas
        if (req.method === 'GET') {
            const snapshot = await getDocs(collection(db, 'accounts'));
            const accounts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            return res.json(accounts);
        }

        // POST /api/accounts — cria nova conta
        if (req.method === 'POST') {
            const { email, targetDate } = req.body;
            const id = uuidv4();
            const newAccount = { id, email, targetDate, reminder10MinSent: false, readySent: false };
            await setDoc(doc(db, 'accounts', id), newAccount);
            return res.status(201).json(newAccount);
        }

        // DELETE /api/accounts — limpa tudo
        if (req.method === 'DELETE') {
            const snapshot = await getDocs(collection(db, 'accounts'));
            for (const d of snapshot.docs) {
                await deleteDoc(d.ref);
            }
            return res.json({ success: true });
        }

        res.status(405).end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
