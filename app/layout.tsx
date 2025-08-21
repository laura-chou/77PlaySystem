import '@/styles/_globals.scss';
import PlayfulDoodle from './components/PlayfulDoodle';
import Script from 'next/script';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" type="image/png" href="/icon/favicon-96x96.png" sizes="96x96" />
                <link rel="icon" type="image/svg+xml" href="/icon/favicon.svg" />
                <link rel="shortcut icon" href="/icon/favicon.ico" />
                <link rel="apple-touch-icon" sizes="180x180" href="/icon/apple-touch-icon.png" />
                <meta name="apple-mobile-web-app-title" content="77Play" />
                <link rel="manifest" href="/icon/site.webmanifest" />
                <Script src="/js/css-doodle.min.js" strategy="beforeInteractive" />
            </head>
            <body>
                <PlayfulDoodle />
                {children}
            </body>
        </html>
    )
}