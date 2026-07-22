export function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function isPushSubscribed() {
  if (!('serviceWorker' in navigator)) return false;
  const registration = await navigator.serviceWorker.getRegistration('/sw.js');
  if (!registration) return false;
  const subscription = await registration.pushManager.getSubscription();
  return !!subscription;
}

export async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker is not supported by your browser.');
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  // Get public VAPID key
  const response = await fetch('/api/vapidPublicKey');
  if (!response.ok) throw new Error('Failed to fetch VAPID key');
  
  const { publicKey } = await response.json();
  const applicationServerKey = urlB64ToUint8Array(publicKey);

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });

    return true;
  } catch (error) {
    console.error('Failed to subscribe the user: ', error);
    throw error;
  }
}
