'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getChatChannels } from '@/lib/hooya-api-client';

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    const redirectToFirstChannel = async () => {
      try {
        const response = await getChatChannels();
        const channels = response.channels || [];

        if (channels.length > 0) {
          router.replace(`/chat/channel/${channels[0].name}`);
        }
      } catch (error) {
        console.error('failed to load channels:', error);
      }
    };

    redirectToFirstChannel();
  }, [router]);

  return (
    <main>
      <div id="home-search">
        <h1>Chat</h1>
        <div className="subtext">Loading...</div>
      </div>
    </main>
  );
}
