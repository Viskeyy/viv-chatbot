export const handleChunk = (chunk) => {
    switch (chunk.type) {
        case 'content':
            return chunk.data
        case 'functionCall':
            return (
                '### 🔧 Function Call' +
                '\n' +
                `- **Name:** ${chunk.data?.name ?? 'unknown'}` +
                '\n' +
                `- **Arguments:** ${chunk.data?.arguments}` +
                '\n --- \n'
            )
        case 'functionCallResult':
            return (
                '### ✅ Function Call Completed' +
                '\n' +
                `- **Function:** \`${chunk.data?.name ?? 'unknown'}\`` +
                '\n --- \n'
            )
        case 'model':
            return '### 🧠 Model Selected' + '\n' + `- **Model:** ${chunk.data}` + '\n --- \n'
        case 'usage':
            return (
                '\n --- \n' +
                '### 📊 Token Usage' +
                '\n' +
                `- **Total:** ${chunk.data?.total_tokens ?? '-'}` +
                '\n' +
                `- **Prompt:** ${chunk.data?.prompt_tokens ?? '-'}` +
                '\n' +
                `- **Completion:** ${chunk.data?.completion_tokens ?? '-'}`
            )
        default:
            return chunk.data
    }
}
