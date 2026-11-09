# ViettelPost Webhook Mock Simulator (`vtp-webhook-mock`)

Công cụ mô phỏng (Mock Simulator) các trạng thái giao vận ViettelPost dành cho Tester/QA, hỗ trợ bắn Webhook trực tiếp tới backend kiểm thử, chạy local nhẹ nhàng hoặc deploy 1-click lên Vercel.

---

## 🌟 Tính Năng Chính

* **3 Input cốt lõi**:
  * `Target Webhook URL`: Endpoint API của hệ thống cần nhận webhook.
  * `Token`: Token chứng thực của ViettelPost (mặc định: `xxx` hoặc tester tự cấu hình).
  * `Mã đơn hàng`: Mã vận đơn (`ORDER_NUMBER`), có nút gán nhanh `TRACKING-NOT-FOUND`.
* **5 Trạng thái (Status Codes) chuẩn không trùng lặp**:
  * **200** — *Đã lấy hàng*
  * **500** — *Đang vận chuyển*
  * **501** — *Giao hàng thành công* (hoặc hoàn về seller)
  * **506** — *Giao hàng không thành công*
  * **999** — *Trạng thái giả lập không hỗ trợ* (Edge case)
* **Realtime Payload Viewer**: Xem trước JSON đúng chuẩn ViettelPost kèm nút sao chép một chạm.
* **Thời gian thực (`ORDER_STATUSDATE`)**: Tự động sinh `DD/MM/YYYY HH:mm:ss` theo giờ hiện tại hoặc tùy chỉnh.
* **Response Inspector**: Hiển thị HTTP status code, độ trễ (latency ms) và response body từ server nhận webhook.
* **Ghi nhớ cấu hình**: Tự động lưu `Target URL` và `Token` vào `LocalStorage` của trình duyệt.
* **Zero Dependencies**: Chạy hoàn toàn bằng các module gốc của Node.js (không cần tải `node_modules` nặng nề).

---

## 📦 Cấu Trúc Dự Án

```
E:\PROJECT\vtp-webhook-mock/
├── api/
│   └── send-webhook.js     # Vercel Serverless Function
├── lib/
│   └── webhook.js          # Helper chuẩn hóa payload & gửi webhook
├── public/
│   └── index.html          # Giao diện Tester (Tailwind CSS)
├── test/
│   └── webhook.test.js     # Unit test tự động bằng Node test runner
├── local-server.js / server.js # Local HTTP server
├── vercel.json             # Cấu hình deploy Vercel
├── package.json
└── README.md
```

---

## 🚀 Hướng Dẫn Chạy Local

Chỉ cần máy đã cài đặt Node.js (khuyến nghị phiên bản 18+ hoặc 20+):

1. Mở terminal tại thư mục dự án:
   ```bash
   cd E:\PROJECT\vtp-webhook-mock
   ```

2. Khởi động server:
   ```bash
   npm start
   # Hoặc: node server.js
   ```

3. Mở trình duyệt và truy cập: **`http://localhost:3000`**

4. Chạy kiểm thử tự động (Unit Test):
   ```bash
   npm test
   ```

---

## ☁️ Hướng Dẫn Deploy Lên Vercel

Dự án được cấu hình sẵn theo chuẩn **Vercel Serverless Functions**:

### Cách 1: Deploy qua GitHub (Khuyên dùng)
1. Đẩy code lên GitHub repository của bạn:
   ```bash
   git init
   git add .
   git commit -m "feat: initial vtp-webhook-mock"
   git remote add origin https://github.com/<your-username>/vtp-webhook-mock.git
   git push -u origin main
   ```
2. Truy cập [vercel.com](https://vercel.com), bấm **Add New Project** -> Chọn repo vừa đẩy.
3. Bấm **Deploy**. Vercel sẽ tự động nhận diện cấu hình `vercel.json` và deploy ngay tức thì.

### Cách 2: Deploy qua Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## 📋 Định Dạng Webhook Chuẩn ViettelPost

```json
{
  "TOKEN": "xxx",
  "DATA": {
    "ORDER_NUMBER": "303296563226",
    "ORDER_STATUSDATE": "29/09/2026 13:00:00",
    "ORDER_STATUS": 200,
    "STATUS_NAME": "Đã lấy hàng"
  }
}
```
