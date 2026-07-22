import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPublicKey } from './_lib/vapid';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).end();
    try {
        const publicKey = await getPublicKey();
        res.json({ publicKey });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to get VAPID key' });
    }
}
