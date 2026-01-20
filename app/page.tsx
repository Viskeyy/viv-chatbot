'use client'

import { MarkdownRender } from '@/components/MarkdownRender'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { randomId } from '@/lib/randomId'
import { cn } from '@/lib/utils'
import Viv from '@yomo/viv'
import { Copy, CornerDownLeft, Github, RefreshCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type ChatMessage = {
    id: string
    content: string
    role: 'user' | 'assistant'
}

export default function Home() {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const vivRef = useRef<Viv | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

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

            const contentBlock: string[] = []
            const toolsBlock: string[] = ["<div className='flex w-full flex-wrap items-center gap-4'>", '</div>\n\n']
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
                        toolsBlock.splice(
                            toolsBlock.length - 1,
                            0,
                            `<FunctionSheet name='🔧 Function Call — ${name}' detail='${args}'></FunctionSheet>`,
                        )
                        break
                    }
                    case 'functionCallResult': {
                        const { name, result: res } = data as any
                        toolsBlock.splice(
                            toolsBlock.length - 1,
                            0,
                            `<FunctionSheet name='✅ Function Result — ${name}' detail='${res}'></FunctionSheet>`,
                        )
                        break
                    }
                    case 'content':
                        contentBlock.push(data as any)
                        break
                    default:
                        break
                }

                const toolsHtml = toolsBlock.length > 2 ? toolsBlock.join('') : ''
                const orderedBlocks = [toolsHtml, ...contentBlock].filter(Boolean).join('')

                setTotalMessages((prev) =>
                    prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, content: orderedBlocks } : msg)),
                )
            }

            const toolsHtml = toolsBlock.length > 2 ? toolsBlock.join('') : ''

            const finalBlocks = [
                toolsHtml,
                ...contentBlock,
                `\n\n<ModelInfo model='${modelBlock}' usage='${usageBlock}' />`,
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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [totalMessages])

    useEffect(() => {
        textareaRef.current?.focus()

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
                e.preventDefault()
                textareaRef.current?.focus()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

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
                                    {message.content && message.role === 'user' ? (
                                        <div className="flex items-center gap-2">
                                            <MarkdownRender text={message.content} />
                                            <div title="copy">
                                                <Copy
                                                    className="size-4 cursor-pointer opacity-50 transition-opacity hover:opacity-100"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(message.content)
                                                    }}
                                                />
                                            </div>
                                            <div title="retry">
                                                <RefreshCcw
                                                    className={cn(
                                                        'size-4 transition-all',
                                                        loading
                                                            ? 'cursor-not-allowed opacity-20'
                                                            : 'cursor-pointer opacity-50 hover:rotate-180 hover:opacity-100',
                                                    )}
                                                    onClick={() => !loading && handleStreamRequest(message.content)}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <MarkdownRender text={message.content} />
                                    )}
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
                    <Textarea
                        ref={textareaRef}
                        placeholder="Command/Ctrl + I to focus, Return/Enter to send a message..."
                        className="h-16 resize-none border-0 bg-transparent text-base leading-relaxed shadow-none focus-visible:ring-0"
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
                        value={inputValue}
                        onKeyDown={(e: React.KeyboardEvent) => {
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
                            onClick={() => handleStreamRequest()}
                            disabled={loading || isInputEmpty}
                        >
                            Send <CornerDownLeft className="size-4" />
                        </Button>
                    </InputGroupAddon>
                </InputGroup>
            </div>
        </main>
    )
}
