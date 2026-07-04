**🇬🇧 [English](README.md)** | 🇻🇳 Tiếng Việt

# Research Hub

Dashboard cá nhân, local-first cho 1 researcher — quản lý notes, tasks,
experiments (có nhánh như git), references, milestones, và code thực nghiệm.
Không có database: mọi thứ là file Markdown trong `vault/`, đồng bộ qua git
như bình thường.

## Cấu trúc

```
vault/
  current-direction.md   # hướng nghiên cứu hiện tại — nguồn sự thật duy nhất
  notes/                 # brainstorm tự do
  tasks/                 # việc cần làm
  experiments/           # thực nghiệm, có parent_experiment để rẽ nhánh
  references/             # paper/tài liệu tham khảo
  milestones/             # mốc lớn
  sessions/               # 1 file/ngày, tự tạo khi mở dashboard
  code/                   # scaffold reproducible-research (xem code/README.md)
  _templates/             # schema mẫu cho từng loại — KHÔNG phải content thật
app/                      # dashboard (React + Express), chạy local
```

## Bắt đầu (sau khi clone về)

```
cd app
npm install
```

Vault đang trống (chỉ có template). Chọn **1 trong 3 cách** để khởi tạo:

1. **Dùng AI agent** (Claude Code hoặc tương tự): mở terminal trong repo này,
   bảo agent *"đọc AGENT.md và giúp tôi onboard"*. Agent sẽ hỏi vài câu (tên
   project, hướng nghiên cứu, mốc/task đầu tiên nếu có) rồi tự tạo file.
2. **Script terminal**: `npm run vault:onboard` — hỏi cùng những câu đó ngay
   trong terminal, không cần agent.
3. **Ngay trong app**: chạy `npm run dev`, mở `http://localhost:5173` — nếu
   vault còn trống, dashboard tự hiện form onboarding.

Cả 3 cách đều tạo ra đúng 1 kết quả: `vault/current-direction.md` được điền,
và (nếu bạn cho biết) 1 milestone + 1 task đầu tiên.

## Dùng hằng ngày

```
cd app
npm run dev
```

- Client: `http://localhost:5173`, API: `http://localhost:3001`.
- Sidebar: **Sessions** (mỗi ngày làm việc 1 file, mục tiêu tự điền từ
  `next_action` của experiment đang chạy), **Notes** (nổi bật note đang nuôi
  hướng active, mờ note cũ không đụng tới), **Tasks/Experiments/References/
  Milestones**, **External** (browse + sửa trực tiếp file `.md`/`.txt` trong
  `code/` hoặc thư mục project ngoài đã đăng ký).
- Gõ `[[id]]` trong note để link chéo — tự thành link bấm được, và hiện
  ngược lại ở "Backlinks" của file được trỏ tới.
- Nút **"+ Mới"** tạo đúng loại content (Note/Task/Experiment/Reference/
  Milestone) với đúng khung frontmatter.

## Reset vault

Muốn xoá hết làm lại từ đầu (vd: đang thử nghiệm, muốn về trạng thái sạch):

```
cd app
npm run vault:reset
```

Có xác nhận trước khi xoá. Vault nằm trong git nên nếu lỡ tay vẫn khôi phục
được bằng `git checkout -- vault/` (miễn chưa commit đè lên).

## Schema từng loại content

Xem `vault/_templates/*.md` — đó là nguồn sự thật cho frontmatter schema của
note/task/experiment/reference/milestone/session, có chú thích từng field.
