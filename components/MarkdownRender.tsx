import { marked } from 'marked'

marked.setOptions({
    breaks: true,
    gfm: true,
})

export const MarkdownRender = ({ text }: { text: string }) => {
    const html = marked.parse(text)
    return <div dangerouslySetInnerHTML={{ __html: html }} />
}
