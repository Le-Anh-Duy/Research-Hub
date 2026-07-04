# code/ — reproducible research scaffold

Máy dev có thể không đủ mạnh để chạy training thật (không có GPU, không chạy nổi
PyTorch nặng). Cấu trúc thư mục này tách rời "viết code" (làm ở đây, local) khỏi
"chạy code" (Colab, hoặc máy có GPU khác):

- `src/` — logic thật. Sửa ở đây, trong VS Code, có thể chạy thử unit-test nhỏ
  local (không cần GPU).
- `configs/` — mỗi lần chạy thực nghiệm là 1 file YAML riêng (copy từ
  `configs/example.yaml`). Experiment trong dashboard trỏ tới đúng file config
  đã dùng qua field `config_file`.
- `notebooks/` — CHỈ orchestration (clone repo, cài dependency, gọi hàm trong
  `src/`). Không viết logic trực tiếp trong cell — nếu thấy mình đang viết
  logic thật trong notebook, dừng lại và chuyển nó vào `src/`.
- `sanity_data/` — dữ liệu giả, nhỏ, chỉ để test code chạy được trên máy yếu
  trước khi đẩy lên Colab chạy thật với data lớn.

File `.md`/`.txt` bất kỳ nằm rải rác trong `code/` (như file này) sẽ tự động
xuất hiện trong mục "External" của dashboard — không cần đăng ký gì thêm.
