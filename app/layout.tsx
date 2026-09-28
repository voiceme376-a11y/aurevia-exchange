import type {ReactNode} from 'react';import './globals.css';import {SessionProvider} from 'next-auth/react';
export const metadata={title:'Aurevia Exchange',description:'Aurevia Exchange trading platform'};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en"><body><SessionProvider>{children}</SessionProvider></body></html>}
