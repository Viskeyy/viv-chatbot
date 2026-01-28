'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group'
import { Textarea } from '@/components/ui/textarea'
import { CornerDownLeft, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

type ChatInputProps = {
    value: string
    loading: boolean
    onValueChange: (value: string) => void
    onSubmit: () => void
    onClear: () => void
    isDisabledClear: boolean
}

export const ChatInput = ({ value, loading, onValueChange, onSubmit, onClear, isDisabledClear }: ChatInputProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        textareaRef.current?.focus()

        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'i') {
                event.preventDefault()
                textareaRef.current?.focus()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const isInputEmpty = value.trim().length === 0

    return (
        <InputGroup className="mx-auto w-full max-w-250 rounded-md bg-white p-2 backdrop-blur-2xl transition-all">
            <Textarea
                ref={textareaRef}
                placeholder="Command/Ctrl + I to focus, Return/Enter to send a message..."
                className="h-16 resize-none border-0 bg-transparent text-base leading-relaxed shadow-none focus-visible:ring-0"
                onChange={(event) => onValueChange(event.target.value)}
                value={value}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                        event.preventDefault()
                        onSubmit()
                    }
                }}
                disabled={loading}
            />
            <InputGroupAddon align="inline-end">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            type="button"
                            size="sm"
                            className="h-12 w-24 rounded-md text-xs tracking-widest uppercase transition-transform"
                            disabled={loading || isDisabledClear}
                            variant="ghost"
                        >
                            clear <X className="size-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-100">
                        <DialogTitle className="tracking-widest uppercase">Clear</DialogTitle>
                        <DialogDescription>Clear All Messages?</DialogDescription>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button
                                    variant="outline"
                                    className="rounded-md text-xs tracking-widest uppercase transition-transform"
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <DialogClose asChild>
                                <Button
                                    onClick={onClear}
                                    className="rounded-md text-xs tracking-widest uppercase transition-transform"
                                >
                                    Clear
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Button
                    type="button"
                    size="sm"
                    className="h-12 w-24 rounded-md text-xs tracking-widest uppercase transition-transform"
                    onClick={() => onSubmit()}
                    disabled={loading || isInputEmpty}
                >
                    Send <CornerDownLeft className="size-4" />
                </Button>
            </InputGroupAddon>
        </InputGroup>
    )
}
