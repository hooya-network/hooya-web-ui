'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useInstance } from '../contexts/InstanceContext';

export default function DeepHeader() {
  const [jwt, setJwt] = useState<string | null>(null);
  const { instanceInfo } = useInstance();

  useEffect(() => {
    setJwt(localStorage.getItem('jwt'));
  }, []);

  return (
    <header>
      <ul className="slash-flat-list" id="header-links">
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/tags">Tags</Link>
        </li>
        {jwt && (
          <>
            <li>
              <Link href="/upload">Upload</Link>
            </li>
          </>
        )}
        <li>
          <Link href="/about">About</Link>
        </li>
        {jwt ? (
          <li>
            <Link
              href="/"
              onClick={() => {
                localStorage.removeItem('jwt');
                setJwt(null);
              }}
            >
              Logout
            </Link>
          </li>
        ) : (
          window && (
            <li>
              <Link href="/login">Login</Link>
            </li>
          )
        )}
      </ul>
      <span id="header-title">
        Browsing HooYa! — “{instanceInfo?.instance_name || 'Loading…'}” instance
        ({instanceInfo?.short_id || 'Loading…'})
      </span>
    </header>
  );
}
