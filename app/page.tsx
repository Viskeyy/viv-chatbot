'use client'
import { MarkdownRender } from '@/components/MarkdownRender'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { handleChunk } from '@/lib/handleChunk'
import { randomId } from '@/lib/randomId'
import Viv from '@yomo/viv'
import { Github } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Message = {
    id: string
    content: string
    role: 'user' | 'assistant'
}

export default function Home() {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const vivRef = useRef<Viv | null>(null)

    const [loading, setLoading] = useState(false)

    const [inputValue, setInputValue] = useState('')
    const [totalMessages, setTotalMessages] = useState<Message[]>([
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
        if (!vivRef.current || !inputValue) return

        setLoading(true)

        const userInput = inputValue
        setInputValue('')
        setTotalMessages((prevMessages) => [...prevMessages, { id: randomId(), content: userInput, role: 'user' }])

        const aiMessageId = randomId()
        setTotalMessages((prevMessages) => [...prevMessages, { id: aiMessageId, content: '', role: 'assistant' }])

        try {
            const res = await vivRef.current.chat.completions.stream({
                messages: [...totalMessages.slice(-7), { role: 'user', content: userInput }],
            })

            for await (const chunk of res) {
                const chunkData = handleChunk(chunk)

                setTotalMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                        msg.id === aiMessageId ? { ...msg, content: msg.content + chunkData } : msg,
                    ),
                )
            }
        } catch (error) {
            setTotalMessages((prevMessages) => [
                ...prevMessages,
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

    return (
        <main className="flex h-screen flex-col gap-4 p-4">
            <div className="text-right">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open('https://github.com/Viskeyy/viv-chatbot', '_blank')}
                >
                    <Github />
                </Button>
            </div>

            <div className="flex flex-auto flex-col gap-4 overflow-auto">
                {totalMessages.map((message) => (
                    <div
                        key={message.id}
                        className={`max-w-3/4 ${message.role === 'user' ? 'self-end' : 'self-start'}`}
                    >
                        <Card className="rounded-lg p-2">
                            {message.role === 'assistant' && !message.content && loading ? (
                                <Spinner />
                            ) : (
                                <MarkdownRender text={message.content} />
                            )}
                        </Card>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="flex items-end gap-4">
                <InputGroup>
                    <InputGroupTextarea
                        placeholder="Enter your message here..."
                        className="max-h-28 flex-auto resize-none rounded-lg"
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

                    <InputGroupAddon align="inline-end">{loading && <Spinner />}</InputGroupAddon>
                </InputGroup>
            </div>
        </main>
    )
}
