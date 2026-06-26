import ReactMarkdown, { type Components } from "react-markdown";

// Module-level so the same identity is passed to ReactMarkdown on every
// render — avoids re-walking and re-mapping the AST when the page reader
// re-renders for unrelated state changes (bookmark / note toggles).
const components: Components = {
  p: ({ children }) => <p className="text-style-reader-prose text-fg mb-5">{children}</p>,
  h1: ({ children }) => <h1 className="text-style-heading-1 text-fg mt-12 mb-6">{children}</h1>,
  h2: ({ children }) => <h2 className="text-style-heading-2 text-fg mt-10 mb-5">{children}</h2>,
  h3: ({ children }) => <h3 className="text-style-heading-3 text-fg mt-8 mb-4">{children}</h3>,
  h4: ({ children }) => <h4 className="text-style-heading-4 text-fg mt-6 mb-3">{children}</h4>,
  em: ({ children }) => <em className="italic">{children}</em>,
  strong: ({ children }) => <strong className="font-medium">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="text-style-quote text-fg-muted border-l-2 border-accent pl-5 my-6">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-8 border-border" />,
  ul: ({ children }) => <ul className="list-disc pl-6 mb-5 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 mb-5 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="text-style-reader-prose text-fg">{children}</li>,
};

export function ProseRenderer({ text }: { text: string }) {
  return <ReactMarkdown components={components}>{text}</ReactMarkdown>;
}
