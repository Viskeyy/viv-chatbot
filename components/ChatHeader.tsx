import { Button } from '@/components/ui/button'
import { Github } from 'lucide-react'
import Image from 'next/image'

export const ChatHeader = () => {
    return (
        <div className="flex w-full items-center justify-between">
            <Image src="/home_icon.png" alt="Viv Chatbot" width={32} height={32} />
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
