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
  renderProgress?: number; // 0 to content.length for character-by-character rendering
  charStates?: number[]; // array of render state for each character (0-4, where 4 is final)
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
  const messagesAreaRef = useRef<HTMLTextAreaElement>(null);

  // unicode characters for rendering animation
  const renderChars = ['█', '▓', '▒', '░'];

  // get instance context at the top
  const { subscribeToChatEvents } = useInstance();

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

  // subscribe to chat events
  useEffect(() => {
    const unsubscribe = subscribeToChatEvents((event) => {
      if (event.channel === activeChannel) {
        // add new message with funny rendering states
        const initialCharStates = new Array(event.content.length).fill(0);
        const newMsg = {
          ...event,
          fadeState: 'entering' as const,
          renderProgress: 0,
          charStates: initialCharStates,
        };
        setMessages((prev) => [...prev, newMsg]);

        // start cascading animation
        const startCharacterAnimation = (messageIndex: number) => {
          let currentChar = 0;
          const content = event.content;

          const animateNextChar = () => {
            if (currentChar < content.length) {
              // start animating this one through render states
              const charIndex = currentChar;
              let renderState = 0;

              const animateCharacter = () => {
                if (renderState < renderChars.length) {
                  setMessages((prev) =>
                    prev.map((msg, index) => {
                      if (
                        index === messageIndex &&
                        msg.fadeState === 'entering'
                      ) {
                        const newCharStates = [...(msg.charStates || [])];
                        newCharStates[charIndex] = renderState;
                        return { ...msg, charStates: newCharStates };
                      }
                      return msg;
                    })
                  );
                  renderState++;
                  setTimeout(animateCharacter, 20);
                } else {
                  // character finished cycling, show final character
                  setMessages((prev) =>
                    prev.map((msg, index) => {
                      if (
                        index === messageIndex &&
                        msg.fadeState === 'entering'
                      ) {
                        const newCharStates = [...(msg.charStates || [])];
                        newCharStates[charIndex] = renderChars.length; // final state
                        return { ...msg, charStates: newCharStates };
                      }
                      return msg;
                    })
                  );
                }
              };

              animateCharacter();
              currentChar++;
              setTimeout(animateNextChar, 20);
            } else {
              // all characters started rendering, mark as visible after they finish
              setTimeout(
                () => {
                  setMessages((prev) =>
                    prev.map((msg, index) =>
                      index === messageIndex && msg.fadeState === 'entering'
                        ? { ...msg, fadeState: 'visible' }
                        : msg
                    )
                  );
                },
                renderChars.length * 20 + 20
              ); // wait for last character to finish
            }
          };

          animateNextChar();
        };

        // get the message index and start animation
        setMessages((prev) => {
          const messageIndex = prev.length - 1;
          startCharacterAnimation(messageIndex);
          return prev;
        });
      }
    });

    return unsubscribe;
  }, [activeChannel, subscribeToChatEvents, renderChars.length]);

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

  return (
    <main>
      <div>
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
        <div>
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
                    : messages
                        .map((msg) => {
                          if (msg.fadeState === 'entering' && msg.charStates) {
                            let renderedContent = '';

                            for (let i = 0; i < msg.content.length; i++) {
                              const charState = msg.charStates[i];
                              if (charState >= renderChars.length) {
                                // character finished cycling - show final character
                                renderedContent += msg.content[i];
                              } else {
                                // character is cycling through render states
                                renderedContent += renderChars[charState];
                              }
                            }

                            return renderedContent;
                          }
                          return msg.content;
                        })
                        .join('\n')
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
