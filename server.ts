import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import webpush from 'web-push';
import cron from 'node-cron';
import fs from 'fs';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, addDoc } from 'firebase/firestore';

const PORT = 3000;

const configPath = './firebase-applet-config.json';
let config: any = null;
let db: any = null;

if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const app = initializeApp(config);
  db = getFirestore(app, config.firestoreDatabaseId);
}

// VAPID keys setup
let vapidKeys = { publicKey: '', privateKey: '' };

async function initVapidKeys() {
  if (!db) return;

  const vapidDocRef = doc(db, 'config', 'vapid');
  const snapshot = await getDoc(vapidDocRef);
  
  if (snapshot.exists()) {
    vapidKeys = snapshot.data() as { publicKey: string, privateKey: string };
  } else {
    vapidKeys = webpush.generateVAPIDKeys();
    await setDoc(vapidDocRef, vapidKeys);
  }

  webpush.setVapidDetails(
    'mailto:investidorbtc22@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

// Database setup
interface Account {
  id: string;
  email: string;
  targetDate: string; // ISO string
  reminder10MinSent: boolean;
  readySent: boolean;
}

// Cron Job
cron.schedule('* * * * *', async () => {
  if (!db) return;

  const accountsSnapshot = await getDocs(collection(db, 'accounts'));
  const accounts = accountsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Account));
  const subsSnapshot = await getDocs(collection(db, 'subscriptions'));
  const subscriptions = subsSnapshot.docs.map(d => d.data() as webpush.PushSubscription);
  
  const now = new Date().getTime();

  for (const account of accounts) {
    const targetTime = new Date(account.targetDate).getTime();
    const timeDiffMs = targetTime - now;
    const timeDiffMin = timeDiffMs / (1000 * 60);

    let updated = false;

    // 5 minute reminder
    if (timeDiffMin <= 5 && timeDiffMin > 0 && !account.reminder10MinSent) {
      account.reminder10MinSent = true;
      updated = true;
      await broadcastPush(subscriptions, {
        title: 'Faltam 5 minutos! ⏳',
        body: `Prepare-se! O e-mail ${account.email} estará recarregado e pronto para uso em apenas 5 minutos.`,
      });
    }

    // Ready reminder
    if (timeDiffMin <= 0 && !account.readySent) {
      account.readySent = true;
      updated = true;
      await broadcastPush(subscriptions, {
        title: 'IA Recarregada! ⚡',
        body: `O e-mail ${account.email} está totalmente recarregado e já pode ser usado agora mesmo!`,
      });
    }

    if (updated) {
      await updateDoc(doc(db, 'accounts', account.id), {
        reminder10MinSent: account.reminder10MinSent,
        readySent: account.readySent
      });
    }
  }
});

async function broadcastPush(subscriptions: webpush.PushSubscription[], payload: any) {
  if (!db) return;

  for (let i = 0; i < subscriptions.length; i++) {
    try {
      await webpush.sendNotification(subscriptions[i], JSON.stringify(payload));
    } catch (error: any) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        console.log('Subscription has expired or is no longer valid: ', error);
        // Delete by endpoint query
        const q = query(collection(db, 'subscriptions'), where('endpoint', '==', subscriptions[i].endpoint));
        const snapshot = await getDocs(q);
        for (const d of snapshot.docs) {
          await deleteDoc(d.ref);
        }
      }
    }
  }
}

async function startServer() {
  await initVapidKeys();
  
  const app = express();
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/vapidPublicKey', (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
  });

  app.post('/api/subscribe', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'DB not initialized' });
    
    const subscription = req.body;
    const q = query(collection(db, 'subscriptions'), where('endpoint', '==', subscription.endpoint));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      await addDoc(collection(db, 'subscriptions'), subscription);
    }
    res.status(201).json({});
  });

  app.delete('/api/accounts', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'DB not initialized' });
    const snapshot = await getDocs(collection(db, 'accounts'));
    for (const d of snapshot.docs) {
      await deleteDoc(d.ref);
    }
    res.json({ success: true });
  });

  app.post('/api/accounts/restore', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'DB not initialized' });
    const { accounts } = req.body;
    if (!Array.isArray(accounts)) return res.status(400).json({ error: 'Invalid payload' });
    
    for (const acc of accounts) {
      const id = acc.id || uuidv4();
      const targetDate = acc.targetDate || new Date().toISOString();
      const email = acc.email || 'imported@example.com';
      await setDoc(doc(db, 'accounts', id), {
        id,
        email,
        targetDate,
        reminder10MinSent: acc.reminder10MinSent || false,
        readySent: acc.readySent || false,
      });
    }
    res.json({ success: true });
  });

  app.get('/api/accounts', async (req, res) => {
    if (!db) return res.json([]);
    const snapshot = await getDocs(collection(db, 'accounts'));
    const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(accounts);
  });

  app.post('/api/accounts', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'DB not initialized' });
    const { email, targetDate } = req.body;
    const id = uuidv4();
    const newAccount: Account = {
      id,
      email,
      targetDate,
      reminder10MinSent: false,
      readySent: false,
    };
    
    await setDoc(doc(db, 'accounts', id), newAccount);
    res.status(201).json(newAccount);
  });

  app.put('/api/accounts/:id', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'DB not initialized' });
    const { targetDate } = req.body;
    await updateDoc(doc(db, 'accounts', req.params.id), {
      targetDate,
      reminder10MinSent: false,
      readySent: false,
    });
    const updated = await getDoc(doc(db, 'accounts', req.params.id));
    res.json({ id: updated.id, ...updated.data() });
  });

  app.delete('/api/accounts/:id', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'DB not initialized' });
    await deleteDoc(doc(db, 'accounts', req.params.id));
    res.json({ success: true });
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
