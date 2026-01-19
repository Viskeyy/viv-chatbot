import { Card } from './ui/card'

export const ModelInfo = ({ model, usage }: { model: string; usage: string }) => {
    return (
        <Card className="rounded-md border-none bg-linear-to-br from-blue-50 to-indigo-50 p-4 text-xs leading-none tracking-widest uppercase shadow-none">
            <div>{model}</div>
            <div>{usage}</div>
        </Card>
    )
}
