'use client'

import { MarkdownRender } from '@/components/MarkdownRender'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { Copy, RefreshCcw } from 'lucide-react'
import { useEffect, useRef } from 'react'

export type ChatMessage = {
    id: string
    content: string
    role: 'user' | 'assistant'
}

type ChatMessagesProps = {
    totalMessages: ChatMessage[]
    loading: boolean
    onRequest: (content?: string) => void
}

export const ChatMessages = ({ totalMessages, loading, onRequest }: ChatMessagesProps) => {
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [totalMessages])

    return (
        <div className="no-scrollbar mx-auto flex w-full max-w-250 flex-auto flex-col gap-4 overflow-y-scroll p-2">
            {totalMessages.length === 0 && (
                <div className="flex h-full w-full items-center justify-center text-9xl">Hello!</div>
            )}
            {totalMessages.map((message, index) => {
                const isLastAssistantMessage = message.role === 'assistant' && index === totalMessages.length - 1

                return (
                    <div key={message.id} className={cn('gap-2', message.role === 'user' ? 'self-end' : 'self-start')}>
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
                                            onClick={() => !loading && onRequest(message.content)}
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
    )
}
