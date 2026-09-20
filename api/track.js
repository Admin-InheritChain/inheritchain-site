import { MongoClient } from 'mongodb';

let clientPromise;
function getDb() {
  if (!clientPromise) {
    clientPromise = new MongoClient(process.env.MONGODB_URI).connect();
  }
  return clientPromise.then(c => c.db());
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const p = String(req.body?.p ?? '/').slice(0, 120);
  const r = String(req.body?.r ?? '').slice(0, 120);
  if (!/^\/[\w\-./]*$/.test(p) || (r && !/^[\w.\-:]+$/.test(r))) {
    return res.status(400).json({ error: 'Bad input' });
  }
  try {
    const col = (await getDb()).collection('pageviews');
    await col.insertOne({ ts: new Date(), p, r });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('track:', err.message);
    return res.status(500).json({ error: 'Failed' });
  }
}
