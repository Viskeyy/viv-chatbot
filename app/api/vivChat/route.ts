import { createVivgrid } from '@vivgrid/ai-sdk-provider'
import { streamText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'

const vivgrid = createVivgrid({
    apiKey: process.env.VIVGRID_API_KEY,
    baseURL: 'https://api.vivgrid.com/v1',
})

const viv = vivgrid()

export async function POST(req: NextRequest) {
    try {
        if (!process.env.VIVGRID_API_KEY) {
            return NextResponse.json({ error: 'API key is not configured' }, { status: 500 })
        }

        let messages
        try {
            const body = await req.json()
            messages = body.messages
        } catch (error) {
            return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
        }

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: 'Messages array is required and must not be empty' }, { status: 400 })
        }

        const result = await streamText({
            model: viv,
            messages,
        })

        return result.toTextStreamResponse()
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'AI_UnsupportedModelVersionError') {
                return NextResponse.json({ error: 'Model version not supported' }, { status: 500 })
            }

            if (error.message.includes('fetch') || error.message.includes('network')) {
                return NextResponse.json({ error: 'Failed to connect to AI service' }, { status: 503 })
            }

            if (error.message.includes('401') || error.message.includes('unauthorized')) {
                return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
            }

            if (error.message.includes('429') || error.message.includes('rate limit')) {
                return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
            }

            return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
        }

        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
    }
}
