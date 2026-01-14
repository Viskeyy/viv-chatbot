import { marked } from 'marked'

marked.use({
    breaks: true,
    gfm: true,
})

export const MarkdownRender = ({ text }: { text: string }) => {
    const html = marked.parse(text.trim()) as string
    return <div className="prose prose-invert" dangerouslySetInnerHTML={{ __html: html }} />
}
