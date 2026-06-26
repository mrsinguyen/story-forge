import { useMemo } from "react";
import { ClockworkSpinner } from "./clockwork-spinner";

/*
 * One-line atmospheric lines in the tone of the novel — herb-gathering,
 * the mountain, and the long road of cultivation. Picked at random per
 * pending instance.
 */
const quotes = [
  "Đầu xuân, mưa phùn kéo dài mấy ngày liền…",
  "Dưới chân Đại Mang Sơn, khói bếp bay lên rất chậm.",
  "Người không có chỗ dựa, thường không sống dễ dàng.",
  "Mỗi bước chân, hắn đều dò trước rồi mới đặt.",
  "Sương hôm nay dày hơn hôm qua.",
  "Con đường tu tiên, đi chậm mà chắc.",
  "Linh khí trong trời đất, chậm rãi tụ về.",
  "Một đồng cũng không nên để mất.",
  "Đường lên núi xa, lòng người càng phải tỉnh.",
  "Tiếng côn trùng vang lên không ngừng trong đêm.",
];

export function PendingScreen() {
  // Lock the quote for the lifetime of this pending screen.
  const quote = useMemo(() => quotes[Math.floor(Math.random() * quotes.length)], []);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-6">
      <ClockworkSpinner size={36} />
      <p className="text-style-quote text-fg-muted text-center max-w-md">{quote}</p>
    </div>
  );
}
