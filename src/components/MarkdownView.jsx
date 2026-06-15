import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Rendu markdown stylé pour le thème sombre.
// Les liens externes s'ouvrent dans un nouvel onglet.
export default function MarkdownView({ source }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, href, children, ...props }) => {
            const external = href && /^https?:\/\//.test(href)
            return (
              <a
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                {...props}
              >
                {children}
              </a>
            )
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
