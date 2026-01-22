import Viv from '@yomo/viv'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const CRYPTO_IV = Buffer.from(process.env.CRYPTO_IV!, 'base64')
const CRYPTO_NAME = process.env.CRYPTO_NAME!
const CRYPTO_TAG_LENGTH = parseInt(process.env.CRYPTO_TAG_LENGTH!)
const CRYPTO_KEY = await crypto.subtle.importKey(
    'jwk',
    JSON.parse(process.env.CRYPTO_KEY!),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
)

export const decrypt = async (ciphertext: string): Promise<string> => {
    const ctBuf = await crypto.subtle.decrypt(
        { name: CRYPTO_NAME, iv: CRYPTO_IV, tagLength: CRYPTO_TAG_LENGTH },
        CRYPTO_KEY,
        Buffer.from(ciphertext, 'base64'),
    )
    return new TextDecoder().decode(ctBuf)
}

let vivInstance: Viv | null = null
const getViv = (apiKey: string) => {
    if (!vivInstance) {
        vivInstance = new Viv({
            apiKey,
            baseURL: 'https://api.vivgrid.com/v1',
            defaultHeaders: {
                'X-Response-Format': 'vivgrid',
                Accept: 'text/event-stream',
            },
        })
    }
    return vivInstance
}

export const POST = async (req: NextRequest) => {
    const body = await req.json()
    const { encryptedKey, messages } = body

    if (!encryptedKey) return NextResponse.json({ error: 'VIVGRID_API_KEY is missed' }, { status: 500 })

    let apiKey: string
    try {
        apiKey = await decrypt(encryptedKey)
    } catch {
        return NextResponse.json({ error: 'Invalid encrypted key' }, { status: 400 })
    }

    const viv = getViv(apiKey)

    try {
        const stream = await viv.chat.completions.stream({ messages })

        const readable = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder()
                try {
                    for await (const chunk of stream) {
                        controller.enqueue(encoder.encode(JSON.stringify(chunk) + '\n'))
                    }
                } catch (e) {
                    controller.error(e)
                } finally {
                    controller.close()
                }
            },
        })

        return new NextResponse(readable, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': '*',
                'Content-Type': 'text/event-stream',
            },
        })
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 },
        )
    }
}

export const OPTIONS = () => {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': '*',
        },
    })
}
