import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ArrowRight } from 'lucide-react'

export const FunctionSheet = ({ name, detail }: { name: string; detail: string }) => {
    return (
        <Sheet>
            <SheetTrigger className="flex cursor-pointer items-center gap-4 rounded-full border border-emerald-100 bg-emerald-50 p-4 text-left text-sm leading-none uppercase">
                {name}
                <ArrowRight className="size-4" />
            </SheetTrigger>

            <SheetContent
                overlayClassName="bg-transparent"
                className="top-32 right-4 bottom-32 h-auto rounded-xl border shadow-2xl"
            >
                <SheetHeader>
                    <SheetTitle className="wrap-break-word">{name}</SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto px-2">
                    <SheetDescription className="text-muted-foreground text-sm wrap-break-word whitespace-pre-wrap">
                        {detail}
                    </SheetDescription>
                </div>
            </SheetContent>
        </Sheet>
    )
}
