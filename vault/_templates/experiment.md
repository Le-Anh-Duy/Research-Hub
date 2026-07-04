<!-- TEMPLATE — xem ghi chú trong note.md -->
---
id: exp-XXX
title: "Tên thực nghiệm"
parent_experiment: null    # id experiment cha nếu đây là nhánh rẽ ra (vd: exp-001), null nếu là root
branch_type: main          # main | exploratory | spike
status: running            # running | success | failed | abandoned | merged
merged_into: null          # id experiment đã merge vào, nếu status: merged
code_commit: null          # git commit hash lúc chạy, điền sau khi có kết quả
config_file: null          # đường dẫn config trong code/configs/, vd: "code/configs/example.yaml"
colab_url: null            # link Colab notebook đã chạy, điền sau khi có kết quả
next_action: null          # bước tiếp theo cụ thể — dùng để auto-điền "Mục tiêu" của Session
created: 2026-01-01
updated: 2026-01-01
---

## Hypothesis
Đang kiểm chứng giả thuyết gì, và vì sao nghĩ nó đúng.

## Kết quả
_(điền sau khi chạy xong — số liệu, biểu đồ, hay tối thiểu là link tới Colab output)_

## Ghi chú
Bối cảnh, quyết định, điều bất ngờ trong lúc chạy.
