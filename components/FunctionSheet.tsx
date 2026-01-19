import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export const FunctionSheet = ({ name, detail }: { name: string; detail: string }) => {
    return (
        <Sheet>
            <SheetTrigger className="w-full cursor-pointer rounded-md border border-emerald-100 bg-emerald-50 p-4 text-left text-sm leading-none">
                <div>{name}</div>
            </SheetTrigger>

            <SheetContent className="overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{name}</SheetTitle>
                    <SheetDescription>{detail}</SheetDescription>
                </SheetHeader>
            </SheetContent>
        </Sheet>
    )
}
