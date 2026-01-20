import { Button } from '@/components/ui/button'
import { Github } from 'lucide-react'

export const ChatHeader = () => {
    return (
        <div className="flex w-full items-center justify-between">
            <h1 className="text-xl tracking-widest uppercase">Viv Chatbot</h1>
            <Button
                variant="outline"
                size="icon"
                onClick={() => window.open('https://github.com/Viskeyy/viv-chatbot', '_blank', 'noopener noreferrer')}
            >
                <Github />
            </Button>
        </div>
    )
}
