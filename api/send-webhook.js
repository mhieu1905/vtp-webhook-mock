import { buildVtpPayload, sendWebhook } from '../lib/webhook.js';

/**
 * Vercel Serverless Function Handler
 */
export default async function handler(req, res) {
  // Bật CORS cho API để gọi linh hoạt
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({
      name: 'ViettelPost Webhook Mock API',
      status: 'ready',
      message: 'Gửi POST request đến endpoint này kèm { targetUrl, token, orderNumber, orderStatus, statusDate, statusName }'
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        res.status(400).json({ error: 'Body không đúng định dạng JSON' });
        return;
      }
    }

    const { targetUrl, token, orderNumber, orderStatus, statusName, statusDate } = body || {};

    if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.trim()) {
      res.status(400).json({ error: 'Target Webhook URL không được để trống' });
      return;
    }

    const payload = buildVtpPayload({
      token: token || 'xxx',
      orderNumber: orderNumber,
      orderStatus: orderStatus ?? 200,
      statusName,
      statusDate
    });

    const result = await sendWebhook(targetUrl.trim(), payload);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi máy chủ khi gửi Webhook'
    });
  }
}
