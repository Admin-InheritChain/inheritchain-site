import { MongoClient } from 'mongodb';

let clientPromise;
function getDb() {
  if (!clientPromise) {
    clientPromise = new MongoClient(process.env.MONGODB_URI).connect();
  }
  return clientPromise.then(c => c.db());
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  const token = process.env.ADMIN_TOKEN || '';
  if (!token || req.headers.authorization !== `Bearer ${token}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const db = await getDb();
    const col = db.collection('waitlist');

    if (req.method === 'GET') {
      const entries = await col
        .find({}, { projection: { email: 1, createdAt: 1 } })
        .sort({ createdAt: -1 })
        .limit(5000)
        .toArray();

      if (req.query.action === 'stats') {
        const now = Date.now();
        const day = 86400000;
        const daily = [];
        for (let i = 29; i >= 0; i--) {
          daily.push({ date: new Date(now - i * day).toISOString().slice(0, 10), count: 0 });
        }
        const idx = new Map(daily.map((d, i) => [d.date, i]));
        const domains = {};
        let last7 = 0, last30 = 0, undated = 0;
        for (const e of entries) {
          const t = e.createdAt ? e.createdAt.getTime() : null;
          if (t) {
            if (now - t < 7 * day) last7++;
            if (now - t < 30 * day) last30++;
            const key = e.createdAt.toISOString().slice(0, 10);
            if (idx.has(key)) daily[idx.get(key)].count++;
          } else undated++;
          const dom = e.email.split('@')[1];
          if (dom) domains[dom] = (domains[dom] || 0) + 1;
        }

        const views = await db.collection('pageviews')
          .find({}, { projection: { ts: 1, p: 1, r: 1 } })
          .sort({ ts: -1 })
          .limit(20000)
          .toArray();
        const dailyViews = daily.map(d => ({ date: d.date, count: 0 }));
        const vidx = new Map(dailyViews.map((d, i) => [d.date, i]));
        const paths = {}, refs = {};
        let views7 = 0, views30 = 0;
        for (const v of views) {
          const t = v.ts ? v.ts.getTime() : null;
          if (!t) continue;
          if (now - t < 7 * day) views7++;
          if (now - t < 30 * day) views30++;
          const key = v.ts.toISOString().slice(0, 10);
          if (vidx.has(key)) dailyViews[vidx.get(key)].count++;
          if (v.p) paths[v.p] = (paths[v.p] || 0) + 1;
          if (v.r) refs[v.r] = (refs[v.r] || 0) + 1;
        }
        const top = obj => Object.entries(obj)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([label, count]) => ({ label, count }));

        return res.status(200).json({
          total: entries.length,
          last7,
          last30,
          undated,
          daily,
          domains: top(domains).map(d => ({ domain: d.label, count: d.count })),
          views: {
            total: views.length,
            last7: views7,
            last30: views30,
            daily: dailyViews,
            paths: top(paths),
            refs: top(refs)
          }
        });
      }

      return res.status(200).json({
        total: entries.length,
        entries: entries.map(e => ({ email: e.email, createdAt: e.createdAt || null }))
      });
    }

    if (req.method === 'POST') {
      const email = String(req.body?.email ?? '').trim().toLowerCase();
      if (!EMAIL_RE.test(email) || email.length > 254) {
        return res.status(400).json({ error: 'Invalid email' });
      }
      const r = await col.updateOne(
        { email },
        { $set: { email }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
      return res.status(200).json({ ok: true, added: r.upsertedCount === 1 });
    }

    if (req.method === 'DELETE') {
      const email = String(req.body?.email ?? '').trim().toLowerCase();
      const r = await col.deleteOne({ email });
      return res.status(200).json({ ok: true, deleted: r.deletedCount });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('admin:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
}
