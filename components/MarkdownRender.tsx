import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { FunctionSheet } from './FunctionSheet'
import { ModelInfo } from './ModelInfo'

export const MarkdownRender = ({ text }: { text: string }) => {
    return (
        <div className="prose max-w-none">
            <ReactMarkdown
                rehypePlugins={[rehypeRaw]}
                components={{ functionsheet: FunctionSheet, modelinfo: ModelInfo } as any}
            >
                {text.trim()}
            </ReactMarkdown>
        </div>
    )
}
