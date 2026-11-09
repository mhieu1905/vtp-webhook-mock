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
 * @param {Date} date
 * @returns {string}
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
 * @param {Object} options
 * @param {string} options.token
 * @param {string} options.orderNumber
 * @param {number|string} options.orderStatus
 * @param {string} [options.statusName]
 * @param {string} [options.statusDate]
 * @returns {Object}
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
 * @param {string} targetUrl
 * @param {Object} payload
 * @param {Object} [customHeaders]
 * @returns {Promise<Object>}
 */
export async function sendWebhook(targetUrl, payload, customHeaders = {}) {
  if (!targetUrl || typeof targetUrl !== 'string') {
    throw new Error('Target Webhook URL không hợp lệ hoặc để trống');
  }

  const startTime = Date.now();
  let response;
  let responseBody = '';
  let contentType = '';
  let status = 0;
  let statusText = '';
  let headers = {};

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ViettelPost-Webhook-Mock/1.0',
        ...customHeaders
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000) // Timeout 15s
    });

    const durationMs = Date.now() - startTime;
    status = res.status;
    statusText = res.statusText;
    contentType = res.headers.get('content-type') || '';
    
    // Thu thập response headers
    res.headers.forEach((value, key) => {
      headers[key] = value;
    });

    responseBody = await res.text();
    
    // Thử parse JSON nếu có
    let parsedBody = responseBody;
    try {
      parsedBody = JSON.parse(responseBody);
    } catch {
      // Giữ nguyên chuỗi thô nếu không phải JSON
    }

    return {
      success: res.ok,
      status,
      statusText,
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
