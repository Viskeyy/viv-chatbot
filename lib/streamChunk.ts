type StreamChunkType = 'model' | 'usage' | 'functionCall' | 'functionCallResult' | 'content' | string

type StreamChunk = {
    type: StreamChunkType
    data: unknown
}

type StreamState = {
    contentBlock: string[]
    toolsBlock: string[]
    modelBlock: string | null
    usageBlock: string | null
}

type UsagePayload = {
    total_tokens?: number
    prompt_tokens?: number
    completion_tokens?: number
}

const formatTokens = (value?: number) => (typeof value === 'number' ? value.toLocaleString('en-US') : '-')

export const applyStreamChunk = (chunk: StreamChunk, state: StreamState) => {
    switch (chunk.type) {
        case 'model':
            state.modelBlock = `🧠 Model Selected · ${chunk.data ?? 'unknown model'}`
            break
        case 'usage': {
            const { total_tokens, prompt_tokens, completion_tokens } = chunk.data as UsagePayload
            state.usageBlock =
                '📊 Token Usage · ' +
                `Total ${formatTokens(total_tokens)} | Prompt ${formatTokens(prompt_tokens)} | Completion ${formatTokens(completion_tokens)}`
            break
        }
        case 'functionCall': {
            const { name, arguments: args } = chunk.data as { name?: string; arguments?: string }
            state.toolsBlock.splice(
                state.toolsBlock.length - 1,
                0,
                `<FunctionSheet name='🔧 Function Call — ${name}' detail='${args}'></FunctionSheet>`,
            )
            break
        }
        case 'functionCallResult': {
            const { name, result } = chunk.data as { name?: string; result?: string }
            state.toolsBlock.splice(
                state.toolsBlock.length - 1,
                0,
                `<FunctionSheet name='✅ Function Result — ${name}' detail='${result}'></FunctionSheet>`,
            )
            break
        }
        case 'content':
            state.contentBlock.push(chunk.data as string)
            break
        default:
            break
    }
}
