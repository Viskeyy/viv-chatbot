import { marked } from 'marked'

marked.use({
    breaks: true,
    gfm: true,
})

export const MarkdownRender = ({ text }: { text: string }) => {
    const html = marked.parse(text)
    return <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
}
