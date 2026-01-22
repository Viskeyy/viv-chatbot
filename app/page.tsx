'use client'

import { ChatHeader } from '@/components/ChatHeader'
import { ChatInput } from '@/components/ChatInput'
import { ChatMessages, type ChatMessage } from '@/components/ChatMessages'
import { randomId } from '@/lib/randomId'
import { applyStreamChunk } from '@/lib/streamChunk'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function Home() {
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [totalMessages, setTotalMessages] = useState<ChatMessage[]>([])
    const [encryptedKey, setEncryptedKey] = useState<string | null>(null)

    useEffect(() => {
        const encrypteKeyParam = searchParams.get('apiKey')
        if (encrypteKeyParam) {
            const decoded = decodeURIComponent(encrypteKeyParam)
            setEncryptedKey(decoded)
        } else {
            toast.error('API key not found', { position: 'top-center' })
        }
    }, [searchParams])

    const handleStreamRequest = async (overrideContent?: string) => {
        const content = typeof overrideContent === 'string' ? overrideContent : undefined
        const trimmedInput = (content ?? inputValue).trim()

        if (!trimmedInput) {
            toast.error('Please enter a message', { position: 'top-center' })
            return
        }

        setLoading(true)
        if (!content) setInputValue('')

        const userMessage: ChatMessage = {
            id: randomId(),
            content: trimmedInput,
            role: 'user',
        }

        const assistantMessageId = randomId()
        const assistantPlaceholder: ChatMessage = {
            id: assistantMessageId,
            content: '',
            role: 'assistant',
        }

        const payload = [
            ...totalMessages.slice(-7).map(({ role, content }) => ({ role, content })),
            { role: 'user' as const, content: trimmedInput },
        ]

        setTotalMessages((prev) => [...prev, userMessage, assistantPlaceholder])

        try {
            const requestBody: {
                messages: Array<{ role: 'user' | 'assistant'; content: string }>
                encryptedKey?: string
            } = {
                messages: payload,
            }
            if (encryptedKey) requestBody.encryptedKey = encryptedKey

            const response = await fetch('/api/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            })

            if (!response.ok) {
                const errorText = await response.text()
                const errorMessage =
                    JSON.parse(errorText)?.error || errorText || `HTTP error! status: ${response.status}`
                toast.error(errorMessage, { position: 'top-center' })
                throw new Error(errorMessage)
            }

            const reader = response.body?.getReader()
            if (!reader) throw new Error('No reader available')

            const streamState = {
                contentBlock: [],
                toolsBlock: ["<div className='flex w-full flex-wrap items-center gap-4'>", '</div>\n\n'],
                modelBlock: null,
                usageBlock: null,
            }

            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (!line.trim()) continue
                    try {
                        const chunk = JSON.parse(line)
                        applyStreamChunk(chunk, streamState)

                        const toolsHtml = streamState.toolsBlock.length > 2 ? streamState.toolsBlock.join('') : ''
                        const orderedBlocks = [toolsHtml, ...streamState.contentBlock].filter(Boolean).join('')

                        setTotalMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === assistantMessageId ? { ...msg, content: orderedBlocks } : msg,
                            ),
                        )
                    } catch (e) {
                        console.error('Error parsing chunk:', e, line)
                    }
                }
            }

            const toolsHtml = streamState.toolsBlock.length > 2 ? streamState.toolsBlock.join('') : ''

            const finalBlocks = [
                toolsHtml,
                ...streamState.contentBlock,
                `\n\n<ModelInfo model='${streamState.modelBlock}' usage='${streamState.usageBlock}' />`,
            ]
                .filter(Boolean)
                .join('')

            setTotalMessages((prev) =>
                prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, content: finalBlocks } : msg)),
            )
        } catch (error) {
            setTotalMessages((prev) => [
                ...prev.filter((msg) => msg.id !== assistantMessageId),
                {
                    id: randomId(),
                    content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
                    role: 'assistant',
                },
            ])
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="text-foreground flex h-screen w-screen bg-[#fafafa] p-8">
            <div className="flex w-full flex-col gap-4">
                <ChatHeader />

                <hr />

                <ChatMessages totalMessages={totalMessages} loading={loading} onRequest={handleStreamRequest} />

                <ChatInput
                    value={inputValue}
                    loading={loading}
                    onValueChange={setInputValue}
                    onSubmit={handleStreamRequest}
                />
            </div>
        </main>
    )
}
