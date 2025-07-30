# Feedback API Documentation

## Tổng quan

API Feedback được thiết kế để xử lý việc tạo, đọc, cập nhật và xóa feedback từ Zalo Mini App. API hỗ trợ upload file đính kèm và tích hợp với WebSocket để gửi thông báo real-time.

## Endpoints

### 1. Tạo Feedback (POST /api/feedbacks)

**URL:** `POST /api/feedbacks`

**Content-Type:** `multipart/form-data`

**Request Body:**

```javascript
const formData = new FormData();
formData.append("data[Type]", feedbackType); // "Suggest", "Issue", "Question"
formData.append("data[Title]", subject); // Tiêu đề feedback
formData.append("data[Content]", content); // Nội dung feedback
formData.append("data[Resident]", user?.id); // ID của resident

// Upload files (optional)
files.forEach((file) => {
  formData.append("files.attachments", file);
});
```

**Response Success (201):**

```json
{
  "success": true,
  "message": "Feedback created successfully",
  "data": {
    "id": 1,
    "Type": "Issue",
    "Title": "Vấn đề về điện",
    "Content": "Điện bị cúp thường xuyên",
    "StatusFeedback": "Chưa xử lý",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "publishedAt": "2024-01-15T10:30:00.000Z",
    "Resident": {
      "id": 1,
      "email": "user@example.com",
      "name": "Nguyễn Văn A"
    },
    "attachments": [
      {
        "id": 1,
        "name": "image.jpg",
        "url": "/uploads/image.jpg",
        "formats": {
          "thumbnail": { "url": "/uploads/thumbnail_image.jpg" },
          "small": { "url": "/uploads/small_image.jpg" }
        }
      }
    ]
  }
}
```

**Response Error (400/500):**

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

### 2. Lấy danh sách Feedback (GET /api/feedbacks)

**URL:** `GET /api/feedbacks`

**Query Parameters:**

- `pagination[page]`: Số trang (default: 1)
- `pagination[pageSize]`: Số item mỗi trang (default: 25)
- `filters[Type]`: Lọc theo loại feedback
- `filters[StatusFeedback]`: Lọc theo trạng thái
- `filters[Resident]`: Lọc theo resident ID
- `sort[0]`: Sắp xếp (ví dụ: `createdAt:desc`)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "Type": "Issue",
      "Title": "Vấn đề về điện",
      "Content": "Điện bị cúp thường xuyên",
      "StatusFeedback": "Chưa xử lý",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "Resident": {
        "id": 1,
        "email": "user@example.com",
        "name": "Nguyễn Văn A"
      },
      "attachments": []
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "pageCount": 1,
    "total": 1
  }
}
```

### 3. Lấy chi tiết Feedback (GET /api/feedbacks/:id)

**URL:** `GET /api/feedbacks/:id`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "Type": "Issue",
    "Title": "Vấn đề về điện",
    "Content": "Điện bị cúp thường xuyên",
    "StatusFeedback": "Đang xử lý",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z",
    "Resident": {
      "id": 1,
      "email": "user@example.com",
      "name": "Nguyễn Văn A"
    },
    "attachments": []
  }
}
```

### 4. Cập nhật Feedback (PUT /api/feedbacks/:id)

**URL:** `PUT /api/feedbacks/:id`

**Request Body:**

```json
{
  "data": {
    "StatusFeedback": "Đã xử lý",
    "Title": "Vấn đề về điện - Đã khắc phục"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Feedback updated successfully",
  "data": {
    "id": 1,
    "Type": "Issue",
    "Title": "Vấn đề về điện - Đã khắc phục",
    "StatusFeedback": "Đã xử lý",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### 5. Xóa Feedback (DELETE /api/feedbacks/:id)

**URL:** `DELETE /api/feedbacks/:id`

**Response:**

```json
{
  "success": true,
  "message": "Feedback deleted successfully"
}
```

## Validation Rules

### Tạo Feedback

- `Type`: Bắt buộc, phải là một trong: "Suggest", "Issue", "Question"
- `Title`: Bắt buộc, không được rỗng
- `Content`: Bắt buộc, không được rỗng
- `Resident`: Bắt buộc, phải tồn tại trong database

### Cập nhật Feedback

- `Type`: Nếu có, phải là một trong: "Suggest", "Issue", "Question"
- `StatusFeedback`: Nếu có, phải là một trong: "Chưa xử lý", "Đang xử lý", "Đã xử lý"

### Resident Requirements

- Resident phải tồn tại trong database
- Resident phải có `publishedAt` khác null (đã được publish)
- Nếu resident chưa được publish, API sẽ trả về lỗi 400

## File Upload

### Hỗ trợ file types:

- Images: jpg, jpeg, png, gif, webp
- Videos: mp4, avi, mov, wmv
- Audios: mp3, wav, aac
- Documents: pdf, doc, docx

### Upload format:

```javascript
// Frontend code
const formData = new FormData();
formData.append("data[Type]", "Issue");
formData.append("data[Title]", "Vấn đề về điện");
formData.append("data[Content]", "Điện bị cúp thường xuyên");
formData.append("data[Resident]", "1");

// Upload files
files.forEach((file) => {
  formData.append("files.attachments", file);
});

await fetch("/api/feedbacks", {
  method: "POST",
  body: formData,
});
```

## WebSocket Integration

API feedback tích hợp với WebSocket để gửi thông báo real-time:

### Khi tạo feedback mới:

```json
{
  "type": "feedback_new",
  "feedbackId": 1,
  "status": "chưa_xử_lý",
  "message": "Có feedback mới",
  "feedback": {
    /* feedback data */
  }
}
```

### Khi cập nhật trạng thái:

```json
{
  "type": "feedback_status",
  "feedbackId": 1,
  "status": "Đang xử lý",
  "message": "Feedback Vấn đề về điện của bạn đã chuyển sang trạng thái: Đang xử lý",
  "feedback": {
    /* feedback data */
  }
}
```

## Error Codes

- `400 Bad Request`: Dữ liệu không hợp lệ
- `404 Not Found`: Feedback không tồn tại
- `500 Internal Server Error`: Lỗi server

## Testing

Sử dụng file `test-feedback-api.html` để test API:

1. Mở file `test-feedback-api.html` trong browser
2. Điền thông tin feedback
3. Chọn file đính kèm (nếu có)
4. Click "Create Feedback"
5. Xem kết quả

## Lifecycle Events

### afterCreate

- Tự động gửi thông báo cho admin qua WebSocket
- Email admin được cấu hình trong `lifecycles.ts`

### afterUpdate

- Gửi thông báo cho resident khi trạng thái thay đổi
- Thông báo qua WebSocket nếu resident đang online

## Cấu hình

### Admin emails (lifecycles.ts):

```typescript
const adminEmails = ["nguyenbahien170604@gmail.com"];
```

### WebSocket server:

- Được khởi tạo trong `extensions/websocket-server.ts`
- Map user connections trong global scope

## Published vs Unpublished Residents

### Vấn đề

Strapi có cơ chế draft/publish. Khi resident chưa được publish (`publishedAt` là null), API sẽ không thể tạo feedback với resident đó.

### Giải pháp

API feedback đã được cập nhật để:

- Chỉ chấp nhận residents đã được publish
- Trả về lỗi rõ ràng khi resident chưa được publish
- Filter feedbacks để chỉ hiển thị những feedback có resident đã publish

### Cách kiểm tra

```javascript
// Resident đã publish (hoạt động)
const publishedResident = {
  id: 39,
  publishedAt: "2024-01-15T10:30:00.000Z",
};

// Resident chưa publish (sẽ lỗi)
const unpublishedResident = {
  id: 4,
  publishedAt: null,
};
```

## Security

- Validation đầy đủ cho tất cả input
- Kiểm tra quyền truy cập resident
- Kiểm tra trạng thái published của resident
- Sanitize data trước khi lưu
- Error handling toàn diện
