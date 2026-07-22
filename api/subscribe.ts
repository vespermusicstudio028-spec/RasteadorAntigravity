import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).end();
    try {
        const subscription = req.body;
        const q = query(collection(db, 'subscriptions'), where('endpoint', '==', subscription.endpoint));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            await addDoc(collection(db, 'subscriptions'), subscription);
        }
        res.status(201).json({});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
}
