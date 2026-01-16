'use client'

import { MarkdownRender } from '@/components/MarkdownRender'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { handleChunk } from '@/lib/handleChunk'
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
    const [totalMessages, setTotalMessages] = useState<ChatMessage[]>([
        { id: randomId(), content: 'Hello!', role: 'assistant' },
    ])

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

            for await (const chunk of res) {
                const chunkData = handleChunk(chunk)

                setTotalMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === assistantMessageId ? { ...msg, content: msg.content + chunkData } : msg,
                    ),
                )
            }
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
        <main className="text-foreground flex h-screen w-screen bg-[#020510] p-8">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(95,111,255,0.16),transparent_55%)] opacity-70"
            />

            <div className="flex w-full flex-col gap-4">
                <div className="flex w-full items-center justify-between">
                    <h1 className="text-2xl tracking-[0.12em] text-white uppercase">Viv Chatbot</h1>

                    <Button
                        variant="outline"
                        size="icon"
                        className="bg-white/5 text-white/80 hover:bg-white/10"
                        onClick={() => window.open('https://github.com/Viskeyy/viv-chatbot', '_blank')}
                    >
                        <Github />
                    </Button>
                </div>

                <hr className="border-white/10" />

                <div className="no-scrollbar mx-auto flex w-full max-w-250 flex-auto flex-col gap-4 overflow-y-scroll">
                    {totalMessages.map((message) => {
                        const isAssistantStreaming =
                            message.role === 'assistant' && loading && message.content.length === 0

                        return (
                            <div
                                key={message.id}
                                className={cn(
                                    'gap-4 text-white/90',
                                    message.role === 'user' ? 'self-end' : 'self-start',
                                )}
                            >
                                <div
                                    className={cn(
                                        'rounded-2xl border p-4 text-sm text-pretty shadow-[0_25px_65px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-colors duration-300',
                                        message.role === 'user'
                                            ? 'border-indigo-400/40 bg-linear-to-l from-indigo-500/40 via-purple-500/30 to-sky-500/20 text-white'
                                            : 'border-white/10 bg-white/5 text-white/90',
                                    )}
                                >
                                    {isAssistantStreaming ? (
                                        <div className="flex items-center text-xs font-semibold tracking-[0.3em] text-white/70 uppercase">
                                            <Spinner className="mr-2 size-4 text-white/80" />
                                            <span>Streaming</span>
                                        </div>
                                    ) : (
                                        <MarkdownRender text={message.content} />
                                    )}
                                </div>
                            </div>
                        )
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/*<div className="no-scrollbar mx-auto w-full max-w-250 flex-auto overflow-y-scroll">
                    {totalMessages.map((message) => {
                        const label = message.role === 'user' ? 'You' : 'Viv Assistant'
                        const isAssistantStreaming =
                            message.role === 'assistant' && loading && message.content.length === 0

                        return (
                            <div
                                key={message.id}
                                className={cn(
                                    'group/message flex w-full items-start gap-4 text-white/90',
                                    message.role === 'user' ? 'justify-end' : 'justify-start',
                                )}
                            >
                                {message.role === 'assistant' && (
                                    <div className="ring-border flex size-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/80 ring-1">
                                        <Sparkles className="size-4 text-white/80" />
                                    </div>
                                )}

                                <div className="flex flex-col gap-4">
                                    <div
                                        className={cn(
                                            'flex flex-wrap items-center gap-4 text-[0.65rem] font-semibold tracking-[0.35em] uppercase',
                                            message.role === 'user' ? 'text-white/70' : 'text-white/60',
                                        )}
                                    >
                                        <span>{label}</span>
                                    </div>
                                    <div
                                        className={cn(
                                            'rounded-2xl border p-4 text-sm text-pretty shadow-[0_25px_65px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-colors duration-300',
                                            message.role === 'user'
                                                ? 'border-indigo-400/40 bg-linear-to-l from-indigo-500/40 via-purple-500/30 to-sky-500/20 text-white'
                                                : 'border-white/10 bg-white/5 text-white/90',
                                        )}
                                    >
                                        {isAssistantStreaming ? (
                                            <div className="flex items-center text-xs font-semibold tracking-[0.3em] text-white/70 uppercase">
                                                <Spinner className="mr-2 size-4 text-white/80" />
                                                <span>Streaming</span>
                                            </div>
                                        ) : (
                                            <MarkdownRender
                                                className="text-sm leading-relaxed"
                                                text={message.content}
                                            />
                                        )}
                                    </div>
                                </div>

                                {message.role === 'user' && (
                                    <div
                                        className={cn(
                                            'ring-border flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500/60 via-purple-500/60 to-sky-500/60 text-white ring-1',
                                        )}
                                    >
                                        <span className="text-[0.55rem] font-semibold tracking-wide uppercase">
                                            You
                                        </span>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                    <div ref={messagesEndRef} />
                </div>*/}

                <InputGroup className="mx-auto w-full max-w-250 rounded-2xl border-white/10 bg-white/5 p-2 text-white backdrop-blur-2xl transition-all focus-within:border-white/20">
                    <InputGroupTextarea
                        placeholder="Send a message..."
                        className="h-16 flex-auto resize-none bg-transparent text-base leading-relaxed text-white placeholder:text-white/40 focus:outline-none"
                        onChange={(e) => setInputValue(e.target.value)}
                        value={inputValue}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                                e.preventDefault()
                                void handleStreamRequest()
                            }
                        }}
                        disabled={loading}
                    />
                    <InputGroupAddon align="inline-end" className="h-8 gap-4 pr-4">
                        {loading && (
                            <div className="flex items-center text-[0.65rem] font-semibold tracking-[0.3em] text-white/60 uppercase">
                                <Spinner className="mr-2 size-4 text-white/70" />
                                <span>Live</span>
                            </div>
                        )}
                        <Button
                            type="button"
                            size="sm"
                            className="rounded-full bg-white p-4 text-xs font-bold tracking-[0.2em] text-black uppercase transition-transform hover:bg-white/90 active:scale-95"
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
