import webpush from 'web-push';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

let initialized = false;

export async function initVapid() {
    if (initialized) return;

    const vapidDocRef = doc(db, 'config', 'vapid');
    const snapshot = await getDoc(vapidDocRef);

    let vapidKeys: { publicKey: string; privateKey: string };

    if (snapshot.exists()) {
        vapidKeys = snapshot.data() as { publicKey: string; privateKey: string };
    } else {
        vapidKeys = webpush.generateVAPIDKeys();
        await setDoc(vapidDocRef, vapidKeys);
    }

    webpush.setVapidDetails(
        'mailto:investidorbtc22@gmail.com',
        vapidKeys.publicKey,
        vapidKeys.privateKey
    );

    initialized = true;
    return vapidKeys.publicKey;
}

export async function getPublicKey(): Promise<string> {
    const vapidDocRef = doc(db, 'config', 'vapid');
    const snapshot = await getDoc(vapidDocRef);
    if (snapshot.exists()) {
        return snapshot.data().publicKey as string;
    }
    const key = await initVapid();
    return key ?? '';
}
