import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@src/components/primitives/link";
import { Button } from "@src/components/primitives/button";
import { ContinueReadingRow } from "@src/components/library/continue-reading-row";

export const Route = createFileRoute("/_app/")({
  component: Home,
});

function Home() {
  return (
    <div className="-mt-16 flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-20">
      <span className="text-style-eyebrow text-fg-muted">Tuyển tập truyện</span>

      <h1 className="text-style-display text-fg text-center">
        <span className="text-fg">Story</span> <span className="text-fg-muted">Forge</span>
      </h1>

      <p className="text-style-lead text-fg-muted text-center max-w-md">
        Nơi lưu giữ những thiên truyện, tiểu thuyết và thế giới hư cấu. Mỗi tác phẩm là một câu
        chuyện được dệt nên thành lời.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
        <Button variant="primary" render={<Link to="/library" />}>
          Mở thư viện
        </Button>
      </div>

      <ContinueReadingRow />
    </div>
  );
}
