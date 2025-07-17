'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useInstance } from '@/contexts/InstanceContext';
import {
  sendChatMessage,
  getChatHistory,
  getChatChannels,
} from '@/lib/hooya-api-client';

interface ChatMessage {
  channel: string;
  content: string;
  fadeState?: 'entering' | 'visible';
}

interface Channel {
  name: string;
}

export default function ChatChannelPage() {
  const params = useParams();
  const router = useRouter();
  const activeChannel = params.channel as string;

  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isLockedToBottom, setIsLockedToBottom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesAreaRef = useRef<HTMLTextAreaElement>(null);

  // get instance context at the top
  const { subscribeToChatEvents, instanceInfo } = useInstance();

  // scroll to bottom and check scroll lock status
  const scrollToBottom = () => {
    if (messagesAreaRef.current) {
      messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
    }
  };

  const checkScrollLock = () => {
    if (messagesAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesAreaRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5; // 5px tolerance
      setIsLockedToBottom(isAtBottom);
    }
  };

  useEffect(() => {
    // auto-scroll when locked and new messages arrive
    if (isLockedToBottom && messages.length > 0 && !loading) {
      scrollToBottom();
    }
  }, [messages.length, loading, isLockedToBottom]);

  // load channels on mount
  useEffect(() => {
    const loadChannels = async () => {
      try {
        const response = await getChatChannels();
        setChannels(response.channels || []);
      } catch (error) {
        console.error('failed to load channels:', error);
      }
    };

    loadChannels();
  }, []);

  // load initial chat history when channel changes
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const response = await getChatHistory(activeChannel);
        setMessages(
          (response.messages || []).map((msg: ChatMessage) => ({
            ...msg,
            fadeState: 'visible',
          }))
        );
      } catch (error) {
        // 404 is expected when there's no chat history, just set empty messages
        if (error instanceof Error && error.message.includes('Not Found')) {
          setMessages([]);
        } else {
          console.error('failed to load chat history:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    if (activeChannel) {
      loadHistory();
    }
  }, [activeChannel]);

  // subscribe to real-time chat events
  useEffect(() => {
    const unsubscribe = subscribeToChatEvents((event) => {
      if (event.channel === activeChannel) {
        // add new message with fade-in animation
        const newMsg = { ...event, fadeState: 'entering' as const };
        setMessages((prev) => [...prev, newMsg]);

        // trigger fade-in animation
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((msg, index) =>
              index === prev.length - 1 && msg.fadeState === 'entering'
                ? { ...msg, fadeState: 'visible' }
                : msg
            )
          );
        }, 50);
      }
    });

    return unsubscribe;
  }, [activeChannel, subscribeToChatEvents]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || sending) {
      return;
    }

    const messageToSend = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      await sendChatMessage(activeChannel, messageToSend);
    } catch (error) {
      console.error('failed to send message:', error);
      setNewMessage(messageToSend);
    } finally {
      setSending(false);
    }
  };

  const highlightMentions = (content: string) => {
    const operatorName = instanceInfo?.operator_name;

    if (!operatorName) {
      // unregistered name
      return content;
    }

    // lazy but gets the job done
    const mentionRegex = new RegExp(`(\\s|^)(${operatorName})(\\s|$)`, 'gi');
    return content.replace(mentionRegex, '$1<strong>$2</strong>$3');
  };

  const renderFadeMessage = (message: ChatMessage, index: number) => {
    const baseContent = highlightMentions(message.content);

    if (message.fadeState === 'entering') {
      const fadeBlocks = '░'.repeat(Math.min(message.content.length, 20));
      return (
        <div key={`${index}-entering`} style={{ fontFamily: 'monospace' }}>
          {fadeBlocks}
        </div>
      );
    }

    if (message.fadeState === 'visible') {
      return (
        <div
          key={`${index}-visible`}
          dangerouslySetInnerHTML={{ __html: baseContent }}
        />
      );
    }

    return (
      <div key={index} dangerouslySetInnerHTML={{ __html: baseContent }} />
    );
  };

  return (
    <main>
      <div className="upload-container">
        {/* Channel Selection */}
        {channels.length > 0 && (
          <div style={{ marginBottom: '2ch' }}>
            <ul className="slash-flat-list">
              {channels.map((channel) => (
                <li key={channel.name}>
                  <a
                    onClick={() => router.push(`/chat/channel/${channel.name}`)}
                    style={{
                      cursor: 'pointer',
                      opacity: activeChannel === channel.name ? 1 : 0.5,
                    }}
                  >
                    #{channel.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Chat Messages */}
        <div className="upload-queue">
          <h3>#{activeChannel}</h3>

          {!loading && (
            <div>
              <textarea
                ref={messagesAreaRef}
                onScroll={checkScrollLock}
                readOnly
                value={
                  messages.length === 0
                    ? 'No messages yet. Start the conversation!'
                    : messages.map((msg) => msg.content).join('\n')
                }
                style={{
                  width: '100%',
                  height: '400px',
                  border: '1px solid #ccc',
                  padding: '1ch',
                  marginBottom: '1ch',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                  backgroundColor: '#fafafa',
                }}
              />
              <div
                style={{
                  fontSize: '0.8em',
                  color: '#666',
                  marginTop: '-0.75ch',
                  marginBottom: '1ch',
                  minHeight: '1.2em',
                }}
              >
                {isLockedToBottom ? (
                  <span>locked to bottom</span>
                ) : (
                  <span>&nbsp;</span>
                )}
              </div>
            </div>
          )}

          {/* Message Input */}
          <form onSubmit={handleSendMessage}>
            <div style={{ display: 'flex', gap: '1ch', alignItems: 'center' }}>
              <span>#{activeChannel}:</span>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={sending}
                style={{
                  flex: 1,
                  padding: '0.5ch',
                  border: '1px solid #ccc',
                }}
              />
              <button
                type="submit"
                className="simple-button"
                disabled={!newMessage.trim() || sending}
              >
                {sending ? 'sending...' : 'send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
