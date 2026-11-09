/**
 * Danh sách mã trạng thái ViettelPost chuẩn và tên trạng thái
 */
export const VTP_STATUS_MAP = {
  200: 'Đã lấy hàng',
  500: 'Đang vận chuyển',
  501: 'Giao hàng thành công',
  506: 'Giao hàng không thành công',
  999: 'Trạng thái giả lập không hỗ trợ'
};

/**
 * Định dạng ngày theo chuẩn ViettelPost: DD/MM/YYYY HH:mm:ss
 */
export function formatVtpDate(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const d = pad(date.getDate());
  const m = pad(date.getMonth() + 1);
  const y = date.getFullYear();
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${d}/${m}/${y} ${h}:${min}:${s}`;
}

/**
 * Tạo payload ViettelPost chuẩn
 */
export function buildVtpPayload({ token, orderNumber, orderStatus, statusName, statusDate }) {
  const statusCode = Number(orderStatus);
  const resolvedStatusName = statusName || VTP_STATUS_MAP[statusCode] || 'Trạng thái không xác định';
  const resolvedDate = statusDate || formatVtpDate();

  return {
    TOKEN: token || 'xxx',
    DATA: {
      ORDER_NUMBER: orderNumber ? String(orderNumber).trim() : 'TRACKING-NOT-FOUND',
      ORDER_STATUSDATE: resolvedDate,
      ORDER_STATUS: statusCode,
      STATUS_NAME: resolvedStatusName
    }
  };
}

/**
 * Gửi webhook đến targetUrl và đo thời gian phản hồi
 */
export async function sendWebhook(targetUrl, payload, customHeaders = {}) {
  if (!targetUrl || typeof targetUrl !== 'string') {
    throw new Error('Target Webhook URL không hợp lệ hoặc để trống');
  }

  const startTime = Date.now();
  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ViettelPost-Webhook-Mock/1.0',
        ...customHeaders
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000)
    });

    const durationMs = Date.now() - startTime;
    const headers = {};
    res.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const responseBody = await res.text();
    let parsedBody = responseBody;
    try {
      parsedBody = JSON.parse(responseBody);
    } catch {
      // Giữ nguyên chuỗi nếu không phải JSON
    }

    return {
      success: res.ok,
      status: res.status,
      statusText: res.statusText,
      durationMs,
      headers,
      body: parsedBody,
      rawBody: responseBody,
      payloadSent: payload
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    return {
      success: false,
      status: 0,
      statusText: error.name === 'TimeoutError' ? 'Request Timeout (15s)' : 'Connection Failed',
      durationMs,
      error: error.message,
      payloadSent: payload
    };
  }
}

/**
 * Vercel Serverless Function Handler
 */
export default async function handler(req, res) {
  // CORS Headers
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
      orderNumber,
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
