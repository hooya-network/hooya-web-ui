'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useInstance } from '../contexts/InstanceContext';
import { getRefreshToken, logout } from '../utils/auth';

export default function DeepHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const { instanceInfo } = useInstance();

  useEffect(() => {
    setIsLoggedIn(!!getRefreshToken());
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
        {isLoggedIn && (
          <>
            <li>
              <Link href="/upload">Upload</Link>
            </li>
          </>
        )}
        <li>
          <Link href="/about">About</Link>
        </li>
        {isLoggedIn ? (
          <li>
            <Link
              href="/"
              onClick={async (e) => {
                e.preventDefault();
                await logout();
                setIsLoggedIn(false);
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
            >
              Logout
            </Link>
          </li>
        ) : (
          <li>
            <Link href="/login">Login</Link>
          </li>
        )}
      </ul>
      <span id="header-title">
        Browsing HooYa! — “{instanceInfo?.instance_name || 'Loading…'}” instance
        ({instanceInfo?.short_id || 'Loading…'})
      </span>
    </header>
  );
}
