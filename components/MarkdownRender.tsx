import { marked } from 'marked'

export const MarkdownRender = ({ text }: { text: string }) => {
    const html = marked.parse(text)
    return <div dangerouslySetInnerHTML={{ __html: html }} />
}
