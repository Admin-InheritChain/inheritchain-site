import tls from 'node:tls';
import { MongoClient } from 'mongodb';

let clientPromise;
function getDb() {
  if (!clientPromise) {
    clientPromise = new MongoClient(process.env.MONGODB_URI).connect();
  }
  return clientPromise.then(c => c.db());
}

function sendMail({ host, port, user, pass, from, to, subject, body }) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(port, host, { servername: host });
    socket.setEncoding('utf8');
    socket.setTimeout(20000, () => socket.destroy(new Error('SMTP timeout')));
    socket.once('error', reject);

    let buffer = '';
    let waiter = null;

    socket.on('data', chunk => {
      buffer += chunk;
      if (/\d{3} [^\r\n]*\r\n$/.test(buffer)) {
        const text = buffer;
        buffer = '';
        if (waiter) {
          const w = waiter;
          waiter = null;
          w(text);
        }
      }
    });

    const recv = () => new Promise(res => { waiter = res; });
    const send = line => socket.write(line + '\r\n');

    const step = async (line, expect) => {
      const pending = recv();
      if (line) send(line);
      const res = await pending;
      const code = parseInt(res.slice(0, 3), 10);
      if (!expect.includes(code)) {
        throw new Error(`SMTP expected ${expect}: ${res.trim().split('\r\n').pop()}`);
      }
    };

    (async () => {
      try {
        await step(null, [220]);
        await step('EHLO inheritchain.xyz', [250]);
        await step('AUTH LOGIN', [334]);
        await step(Buffer.from(user).toString('base64'), [334]);
        await step(Buffer.from(pass).toString('base64'), [235]);
        await step(`MAIL FROM:<${from}>`, [250]);
        await step(`RCPT TO:<${to}>`, [250, 251]);
        await step('DATA', [354]);
        const message = [
          `From: InheritChain <${from}>`,
          `To: ${to}`,
          `Subject: ${subject}`,
          'MIME-Version: 1.0',
          'Content-Type: text/plain; charset=utf-8',
          '',
          body,
          '.'
        ].join('\r\n');
        await step(message, [250]);
        send('QUIT');
        socket.end();
        resolve();
      } catch (err) {
        socket.destroy();
        reject(err);
      }
    })();
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  try {
    const db = await getDb();
    await db.collection('waitlist').updateOne(
      { email },
      { $set: { email }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.error('mongodb:', err.message);
    return res.status(500).json({ error: 'Failed to save' });
  }
  try {
    await sendMail({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_USER,
      to: process.env.NOTIFY_TO,
      subject: 'New waitlist subscription',
      body: `New InheritChain waitlist subscription:\n\n${email}\n\n${new Date().toISOString()}`
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('smtp:', err.message);
    return res.status(200).json({ ok: true, emailed: false });
  }
}
