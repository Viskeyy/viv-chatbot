const formatJSON = (value: unknown) => {
    if (value === undefined || value === null) return '-'
    try {
        if (typeof value === 'string') return value
        return JSON.stringify(value, null, 2)
    } catch {
        return String(value)
    }
}

const renderDetails = (summary: string, body: string) =>
    `\n\n<details class="chunk-fold">\n<summary>${summary}</summary>\n<div class="chunk-fold-body">${body}</div>\n</details>\n`

export const handleChunk = (chunk: { type: string; data?: unknown }) => {
    switch (chunk.type) {
        case 'content':
            return chunk.data as string
        case 'functionCall': {
            const data = chunk.data as { name?: string; arguments?: unknown }
            const name = data?.name ?? 'unknown'
            const args = formatJSON(data?.arguments)
            const body = `\n<strong>Function:</strong> ${name}<pre>${args}</pre>`
            return renderDetails(`🔧 Function Call — ${name}`, body)
        }
        case 'functionCallResult': {
            const data = chunk.data as { name?: string; result?: unknown; output?: unknown }
            const name = data?.name ?? 'unknown'
            const result = formatJSON(data?.result ?? data?.output)
            const body = `\n<strong>Return:</strong><pre>${result}</pre>`
            return renderDetails(`✅ Function Result — ${name}`, body)
        }
        case 'model':
            return (
                '\n\n<div class="chunk-chip">' +
                `🧠 Model Selected · <strong>${(chunk.data as string) ?? 'unknown model'}</strong>` +
                '</div>\n'
            )
        case 'usage': {
            const data = chunk.data as {
                total_tokens?: number | string
                prompt_tokens?: number | string
                completion_tokens?: number | string
            }
            return (
                '\n\n<div class="chunk-chip">' +
                '📊 Token Usage · ' +
                `Total ${data?.total_tokens ?? '-'} | Prompt ${data?.prompt_tokens ?? '-'} | Completion ${data?.completion_tokens ?? '-'}` +
                '</div>\n'
            )
        }
        default:
            return chunk.data as string
    }
}
