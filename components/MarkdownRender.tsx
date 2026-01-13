import { marked } from 'marked'

marked.use({
    breaks: true,
    gfm: true,
})

type MarkdownRenderProps = {
    text: string
    className?: string
}

export const MarkdownRender = ({ text, className }: MarkdownRenderProps) => {
    const html = marked.parse(text)
    return <div className="prose prose-invert" dangerouslySetInnerHTML={{ __html: html }} />
}
