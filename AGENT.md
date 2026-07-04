# AGENT.md — hướng dẫn onboarding cho AI agent

Đây là **Research Hub**: vault Markdown local cho 1 researcher (single-user), có
dashboard riêng ở `app/` (React + Express) đọc/ghi trực tiếp vào `vault/`.
Không có database — mọi thứ là file `.md` với frontmatter.

File này chỉ dùng khi người dùng **chủ động yêu cầu** onboard họ (vd: "đọc
AGENT.md và giúp tôi khởi tạo project"). Đừng tự động chạy flow này ở đầu mọi
session — chỉ khi được yêu cầu rõ ràng.

## Bước 1 — Kiểm tra vault đã onboard chưa

Xem các thư mục `vault/tasks/`, `vault/experiments/`, `vault/notes/`,
`vault/milestones/`. Nếu **bất kỳ** thư mục nào có file `.md` (không tính
`vault/_templates/`), vault đã được dùng rồi — đừng onboard lại. Thay vào đó
hỏi người dùng muốn giúp gì (vd: đọc `vault/current-direction.md` để nắm hướng
hiện tại rồi tiếp tục hỗ trợ).

Nếu tất cả đều rỗng → vault "fresh", tiếp tục bước 2.

## Bước 2 — Phỏng vấn nhanh

Hỏi người dùng (hội thoại tự nhiên, không cần đúng thứ tự cứng nhắc):

1. Tên project nghiên cứu là gì?
2. Hướng nghiên cứu / giả thuyết ban đầu — đang định kiểm chứng điều gì, vì sao?
3. (Tuỳ chọn) Mốc đầu tiên muốn đạt là gì?
4. (Tuỳ chọn) Việc cụ thể đầu tiên cần làm ngay là gì?

Không cần hỏi thêm gì khác lúc này (không cần experiment/reference cụ thể —
để người dùng tự tạo sau qua nút "+ Mới" trong app, giữ onboarding nhẹ).

## Bước 3 — Ghi file

Dùng ngày hôm nay thật (không dùng ngày placeholder trong template).

**`vault/current-direction.md`** — ghi đè toàn bộ:

```
---
updated: <YYYY-MM-DD>
---

# <Tên project>

## Current hypothesis

<hướng nghiên cứu / giả thuyết người dùng vừa nói>

## Changelog (pivot log)

- **<YYYY-MM-DD>**: Khởi tạo research hub cho "<Tên project>".
```

**Nếu có mốc đầu tiên** — tạo `vault/milestones/milestone-001.md`. Xem
`vault/_templates/milestone.md` để lấy đúng field (đừng đoán schema — luôn đọc
file template tương ứng trước khi viết, vì schema có thể đã đổi so với mô tả ở
đây). `target_date` để `null` nếu người dùng không cho ngày cụ thể.

**Nếu có việc đầu tiên** — tạo `vault/tasks/task-001.md` tương tự, dựa theo
`vault/_templates/task.md`.

Áp dụng nguyên tắc này cho **mọi** loại content: trước khi tạo note/experiment/
reference/milestone/task bằng tay, luôn đọc file tương ứng trong
`vault/_templates/` trước — đó là nguồn sự thật cho schema, không phải file
này.

## Bước 4 — Xong

Báo người dùng:
- Đã tạo xong `current-direction.md` (+ milestone/task nếu có).
- Chạy `npm install` rồi `npm run dev` trong thư mục `app/` để mở dashboard
  (client ở `localhost:5173`, server API ở `localhost:3001`).
- Nếu project có code thực nghiệm: xem `vault/code/README.md` — vault đã có
  sẵn scaffold reproducible-research (dev local trong `code/src/`, config mỗi
  run trong `code/configs/`, notebook Colab chỉ orchestration).

## Ghi chú khác

- Cách onboard khác (không cần agent): `cd app && npm run vault:onboard`
  (script terminal hỏi cùng 4 câu trên), hoặc mở thẳng dashboard — nếu vault
  rỗng, app tự hiện form onboarding.
- Muốn xoá hết làm lại từ đầu: `cd app && npm run vault:reset` (có xác nhận
  trước khi xoá, vault nằm trong git nên vẫn khôi phục được nếu lỡ tay).
- Chi tiết kiến trúc/API xem `README.md` ở repo root.
