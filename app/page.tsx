'use client'

import { ChatHeader } from '@/components/ChatHeader'
import { ChatInput } from '@/components/ChatInput'
import { ChatMessages, type ChatMessage } from '@/components/ChatMessages'
import { randomId } from '@/lib/randomId'
import { applyStreamChunk } from '@/lib/streamChunk'
import Viv from '@yomo/viv'

import { useEffect, useRef, useState } from 'react'

export default function Home() {
    const vivRef = useRef<Viv | null>(null)

    const [loading, setLoading] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [totalMessages, setTotalMessages] = useState<ChatMessage[]>([])

    useEffect(() => {
        if (vivRef.current) return
        vivRef.current = new Viv({
            apiKey: process.env.NEXT_PUBLIC_VIVGRID_API_KEY!,
            baseURL: '/api',
        })
    }, [])

    const handleStreamRequest = async (overrideContent?: string) => {
        if (!vivRef.current) return
        const input = overrideContent ?? inputValue
        const trimmedInput = input.trim()
        if (!trimmedInput) return

        setLoading(true)
        if (!overrideContent) setInputValue('')

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
            ...(totalMessages.slice(-7).map(({ role, content }) => ({ role, content })) as Array<{
                role: 'user' | 'assistant'
                content: string
            }>),
            { role: 'user' as const, content: trimmedInput },
        ]

        setTotalMessages((prev) => [...prev, userMessage, assistantPlaceholder])

        try {
            const res = await vivRef.current.chat.completions.stream({ messages: payload })

            const streamState = {
                contentBlock: [],
                toolsBlock: ["<div className='flex w-full flex-wrap items-center gap-4'>", '</div>\n\n'],
                modelBlock: null,
                usageBlock: null,
            }

            for await (const chunk of res) {
                applyStreamChunk(chunk, streamState)

                const toolsHtml = streamState.toolsBlock.length > 2 ? streamState.toolsBlock.join('') : ''
                const orderedBlocks = [toolsHtml, ...streamState.contentBlock].filter(Boolean).join('')

                setTotalMessages((prev) =>
                    prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, content: orderedBlocks } : msg)),
                )
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
                ...prev,
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
        <main className="text-foreground flex h-screen w-screen bg-[#fafafa] p-4">
            <div className="flex w-full flex-col gap-4">
                <ChatHeader />

                <hr />

                <ChatMessages totalMessages={totalMessages} loading={loading} onRequest={handleStreamRequest} />

                <ChatInput
                    value={inputValue}
                    loading={loading}
                    onValueChange={setInputValue}
                    onSubmit={handleStreamRequest}
                    onClear={() => setTotalMessages([])}
                    isDisabledClear={totalMessages.length === 0}
                />
            </div>
        </main>
    )
}
