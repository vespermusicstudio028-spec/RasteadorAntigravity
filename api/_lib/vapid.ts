import webpush from 'web-push';
import { supabase } from './supabase';

let initialized = false;

export async function initVapid() {
    if (initialized) return;

    const { data: snapshot, error: fetchError } = await supabase
        .from('config')
        .select('data')
        .eq('id', 'vapid')
        .maybeSingle();

    let vapidKeys: { publicKey: string; privateKey: string };

    if (snapshot && snapshot.data) {
        vapidKeys = snapshot.data as { publicKey: string; privateKey: string };
    } else {
        vapidKeys = webpush.generateVAPIDKeys();
        await supabase
            .from('config')
            .upsert({ id: 'vapid', data: vapidKeys });
    }

    webpush.setVapidDetails(
        'mailto:investidorbtc22@gmail.com', // Change this to your email if needed
        vapidKeys.publicKey,
        vapidKeys.privateKey
    );

    initialized = true;
    return vapidKeys.publicKey;
}

export async function getPublicKey(): Promise<string> {
    const { data: snapshot } = await supabase
        .from('config')
        .select('data')
        .eq('id', 'vapid')
        .maybeSingle();

    if (snapshot && snapshot.data) {
        return (snapshot.data as any).publicKey as string;
    }
    const key = await initVapid();
    return key ?? '';
}
