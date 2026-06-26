import type { SlimChapter, SlimVolume } from "@app/library/-volumes/_shared";
import type { Sin } from "@src/lib/schema";
import { quyen1 } from "@app/library/-volumes/quyen-1";

export type { Sin };
export type Chapter = SlimChapter;
export type Volume = SlimVolume;

export type Series = {
  id: string;
  title: string;
  description: string;
  volumes: Volume[];
};

export const series: Series[] = [
  {
    id: "nhat-pham-ky",
    title: "Nhất Phàm Ký",
    // Stanza breaks (blank lines) are intentional — rendered with
    // `whitespace-pre-line` on the series page. Keep lines at column 0 so the
    // source indentation doesn't leak into the string.
    description: `Tiên đạo vô tình.

Phàm nhân như kiến.

Một thiếu niên nghèo sống dưới chân Đại Mang Sơn vì sinh tồn mà lên núi hái thuốc.

Trong một lần gặp nạn nơi Hắc Phong Nhai, hắn nhặt được một khối cổ ngọc tàn khuyết.

Từ đó bước vào con đường tu tiên.

Hắn vốn cho rằng mình chỉ đang tranh đoạt cơ duyên giữa trời đất.

Nhưng hắn không biết rằng.

Từ khoảnh khắc nhặt lên khối cổ ngọc kia.

Đã có một bàn tay vô hình bắt đầu quan sát hắn.

Mà ánh mắt ấy.

Đã tồn tại từ thời đại trước cả Tiên giới.`,
    volumes: [quyen1.slim],
  },
];
