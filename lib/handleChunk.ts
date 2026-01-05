export const handleChunk = (chunk) => {
    switch (chunk.type) {
        case 'content':
            return chunk.data
        case 'functionCall':
            return `\n > function calling... \n [name]: ${chunk.data.name}, [arguments]: ${chunk.data.arguments} <br/>`
        case 'functionCallResult':
            return `\n > function call done: ${chunk.data.name} <br/>`
        case 'model':
            return `\n > model name: ${chunk.data} <br/>`
        case 'usage':
            return `\n > usage: [total]: ${chunk.data.total_tokens}, [prompt]: ${chunk.data.prompt_tokens}, [completion]: ${chunk.data.completion_tokens} <br/>`
        default:
            return chunk.data
    }
}
