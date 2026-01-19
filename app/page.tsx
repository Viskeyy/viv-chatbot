'use client'

import { MarkdownRender } from '@/components/MarkdownRender'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { randomId } from '@/lib/randomId'
import { cn } from '@/lib/utils'
import Viv from '@yomo/viv'
import { Github, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type ChatMessage = {
    id: string
    content: string
    role: 'user' | 'assistant'
}

export default function Home() {
    const messagesEndRef = useRef<HTMLDivElement>(null)
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

    const handleStreamRequest = async () => {
        if (!vivRef.current) return
        const trimmedInput = inputValue.trim()
        if (!trimmedInput) return

        setLoading(true)
        setInputValue('')

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

            const contentBlock: string[] = []
            let modelBlock: string | null = null
            let usageBlock: string | null = null

            for await (const chunk of res) {
                const { data, type } = chunk

                switch (type) {
                    case 'model':
                        modelBlock = `🧠 Model Selected · ${data ?? 'unknown model'}`
                        break
                    case 'usage':
                        const { total_tokens, prompt_tokens, completion_tokens } = data as any
                        usageBlock =
                            '📊 Token Usage · ' +
                            `Total ${total_tokens ?? '-'} | Prompt ${prompt_tokens ?? '-'} | Completion ${completion_tokens ?? '-'}`
                        break
                    case 'functionCall': {
                        const { name, arguments: args } = data as any
                        contentBlock.push(
                            `<FunctionSheet name='🔧 Function Call — ${name}' detail='${args}'></FunctionSheet>\n\n`,
                        )
                        break
                    }
                    case 'functionCallResult': {
                        const { name, result: res } = data as any
                        contentBlock.push(
                            `<FunctionSheet name='✅ Function Result — ${name}' detail='${res}'></FunctionSheet>\n\n`,
                        )
                        break
                    }
                    case 'content':
                        contentBlock.push(data as any)
                        break
                    default:
                        break
                }

                const orderedBlocks = contentBlock.filter(Boolean).join('')

                setTotalMessages((prev) =>
                    prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, content: orderedBlocks } : msg)),
                )
            }

            const finalBlocks = [...contentBlock, `\n\n<ModelInfo model='${modelBlock}' usage='${usageBlock}' />`]
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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [totalMessages])

    const isInputEmpty = inputValue.trim().length === 0

    return (
        <main className="text-foreground flex h-screen w-screen bg-[#fafafa] p-8">
            <div className="flex w-full flex-col gap-4">
                <div className="flex w-full items-center justify-between">
                    <h1 className="text-xl tracking-widest uppercase">Viv Chatbot</h1>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open('https://github.com/Viskeyy/viv-chatbot', '_blank')}
                    >
                        <Github />
                    </Button>
                </div>

                <hr />

                <div className="no-scrollbar mx-auto flex w-full max-w-250 flex-auto flex-col gap-4 overflow-y-scroll p-2">
                    {totalMessages.length === 0 && (
                        <div className="flex h-full w-full items-center justify-center text-9xl">Hello!</div>
                    )}
                    {totalMessages.map((message, index) => {
                        const isLastAssistantMessage =
                            message.role === 'assistant' && index === totalMessages.length - 1

                        return (
                            <div
                                key={message.id}
                                className={cn('gap-2', message.role === 'user' ? 'self-end' : 'self-start')}
                            >
                                <div
                                    className={cn(
                                        'text-sm text-pretty backdrop-blur-xl',
                                        message.role === 'user'
                                            ? 'rounded-md bg-white px-4 py-2 leading-none shadow'
                                            : 'w-full max-w-full',
                                    )}
                                >
                                    {message.content && <MarkdownRender text={message.content} />}
                                    {loading && isLastAssistantMessage && (
                                        <div
                                            className={cn(
                                                'flex items-center text-xs font-semibold tracking-widest uppercase',
                                                message.content && 'mt-4',
                                            )}
                                        >
                                            <Spinner className="mr-2 size-4" />
                                            <span>Streaming</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <InputGroup className="mx-auto w-full max-w-250 rounded-md bg-white p-2 backdrop-blur-2xl transition-all">
                    <InputGroupTextarea
                        placeholder="Send a message..."
                        className="h-16 bg-transparent text-base leading-relaxed"
                        onChange={(e) => setInputValue(e.target.value)}
                        value={inputValue}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                                e.preventDefault()
                                handleStreamRequest()
                            }
                        }}
                        disabled={loading}
                    />
                    <InputGroupAddon align="inline-end">
                        <Button
                            type="button"
                            size="sm"
                            className="h-12 w-24 rounded-md text-xs tracking-widest uppercase transition-transform"
                            onClick={handleStreamRequest}
                            disabled={loading || isInputEmpty}
                        >
                            <Send className="mr-2 size-4" />
                            Send
                        </Button>
                    </InputGroupAddon>
                </InputGroup>
            </div>
        </main>
    )
}
