import { Toaster } from '@/components/ui/sonner'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

export const metadata: Metadata = {
    title: 'VivChat',
    description:
        'A quick preview for AI Agents based on Vivgrid, and can visualize the tool invocation and token usage',
    icons: { icon: '/favicon.png' },
    openGraph: {
        title: 'VivChat',
        description:
            'A quick preview for AI Agents based on Vivgrid, and can visualize the tool invocation and token usage',
        images: [{ url: '/favicon.png' }],
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                {children}
                <Toaster />
            </body>
        </html>
    )
}
