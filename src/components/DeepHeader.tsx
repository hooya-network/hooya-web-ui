"use client";

import Link from "next/link";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

export default function DeepHeader() {
    const [jwt, setJwt] = useState<string | null>(null)

    useEffect(() => {
        setJwt(localStorage.getItem("jwt"))
    }, [])

    return <header>
        <ul className="slash-flat-list" id="header-links">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/tags">Tags</Link></li>
            <li><Link href="/about">About</Link></li>
            {jwt
                ? <li><Link href="/" onClick={() => {
                    localStorage.removeItem("jwt")
                    setJwt(null)
                }}>Logout</Link></li>
                : window && <li><Link href="/login">Login</Link></li>}
        </ul>
        <span id="header-title">Browsing HooYa! — “Public Demo” instance (0xC262a…a048)</span>
    </header>
}
