import Link from "next/link";

export default function DeepHeader() {
    return <header>
        <ul className="slash-flat-list" id="header-links">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/tags">Tags</Link></li>
            <li><Link href="/about">About</Link></li>
        </ul>
        <span id="header-title">Browsing HooYa! — “Public Demo” instance (0xC262a…a048)</span>
    </header>
}
