'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import { getWebProxyUrl } from '@/lib/runtime-config';
import { getAccessToken } from '@/utils/auth';

export interface InstanceInfo {
  instance_name: string;
  operator_name: string;
  node_id: string;
  short_id: string;
  stats: {
    files_indexed: number;
    associations_count: number;
    tags_count: number;
  };
  daemon_version: {
    version_string: string;
    major: number;
    minor: number;
    patch: number;
    pre: string;
  };
  webui_version: {
    version_string: string;
    major: number;
    minor: number;
    patch: number;
    pre: string;
  };
}

export interface ProcessingEvent {
  cid: string;
  event_type:
    | 'processing_started'
    | 'processing_finished'
    | 'processing_failed'
    | 'thumbnail_generated'
    | 'video_preview_generated';
  long_edge?: number;
  mimetype?: string;
}

export interface ChatEvent {
  channel: string;
  content: string;
  node_id: string;
  signature: string;
}

export type ProcessingCallback = (event: ProcessingEvent) => void;
export type ChatCallback = (event: ChatEvent) => void;

interface InstanceContextType {
  instanceInfo: InstanceInfo | null;
  loading: boolean;
  error: string | null;

  // SSE management
  subscribeToProcessing: (
    cid: string,
    callback: ProcessingCallback
  ) => () => void;
  processingStatus: Map<string, number>;

  subscribeToChatEvents: (callback: ChatCallback) => () => void;
}

const InstanceContext = createContext<InstanceContextType | undefined>(
  undefined
);

export function InstanceProvider({ children }: { children: React.ReactNode }) {
  const [instanceInfo, setInstanceInfo] = useState<InstanceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [processingStatus, setProcessingStatus] = useState<Map<string, number>>(
    new Map()
  );
  const eventSourceRef = useRef<EventSource | null>(null);
  const subscribersRef = useRef<Map<string, Set<ProcessingCallback>>>(
    new Map()
  );
  const chatSubscribersRef = useRef<Set<ChatCallback>>(new Set());
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${getWebProxyUrl()}/api/system-info`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const nodeId = data.node_id;
        const shortId =
          nodeId?.length <= 11
            ? nodeId
            : `${nodeId?.slice(0, 7)}…${nodeId?.slice(-4)}`;

        setInstanceInfo({
          ...data,
          short_id: shortId,
        });
        setError(null);
      } catch (err) {
        console.error('failed to fetch system info:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSystemInfo();
  }, []);

  const getRetryInterval = useCallback((retryCount: number) => {
    if (retryCount < 5) {
      return 2000; // 2s for 10s
    } else if (retryCount < 9) {
      return 5000; // 5s for 20s
    } else {
      return 30000; // 30s forever until reconnect
    }
  }, []);

  const startSSEConnection = useCallback(() => {
    if (eventSourceRef.current) {
      return; // connected
    }

    const accessToken = getAccessToken();
    const url = accessToken
      ? `${getWebProxyUrl()}/api/events/instance?auth=${encodeURIComponent(accessToken)}`
      : `${getWebProxyUrl()}/api/events/instance`;

    const eventSource = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      retryCountRef.current = 0; // reset retry count on successful connection
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);

      if (eventSourceRef.current === eventSource) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // schedule retry
      const retryInterval = getRetryInterval(retryCountRef.current);
      retryCountRef.current++;
      retryTimeoutRef.current = setTimeout(() => {
        startSSEConnection();
      }, retryInterval);
    };

    const handleProcessingEvent = (eventName: string, data: any) => {
      const cid = data.cid;
      if (!cid) return;

      const event: ProcessingEvent = {
        cid,
        event_type: eventName as ProcessingEvent['event_type'],
        long_edge: data.long_edge,
        mimetype: data.mimetype,
      };

      // update processing status
      setProcessingStatus((prev) => {
        const newMap = new Map(prev);
        switch (eventName) {
          case 'processing_started':
            newMap.set(cid, 1);
            break;
          case 'processing_finished':
            newMap.set(cid, 0);
            break;
          case 'processing_failed':
            newMap.set(cid, 2);
            break;
          case 'thumbnail_generated':
          case 'video_preview_generated':
            // keep current status, just notify
            break;
        }
        return newMap;
      });

      // notify subscribers
      const subscribers = subscribersRef.current.get(cid);
      if (subscribers) {
        subscribers.forEach((callback) => callback(event));
      }
    };

    eventSource.addEventListener('processing_started', (e) => {
      handleProcessingEvent('processing_started', JSON.parse(e.data));
    });

    eventSource.addEventListener('processing_finished', (e) => {
      handleProcessingEvent('processing_finished', JSON.parse(e.data));
    });

    eventSource.addEventListener('processing_failed', (e) => {
      handleProcessingEvent('processing_failed', JSON.parse(e.data));
    });

    eventSource.addEventListener('thumbnail_generated', (e) => {
      handleProcessingEvent('thumbnail_generated', JSON.parse(e.data));
    });

    eventSource.addEventListener('video_preview_generated', (e) => {
      handleProcessingEvent('video_preview_generated', JSON.parse(e.data));
    });

    eventSource.addEventListener('chat_message', (e) => {
      try {
        const chatEvent: ChatEvent = JSON.parse(e.data);
        chatSubscribersRef.current.forEach((callback) => callback(chatEvent));
      } catch (err) {
        console.error('failed to parse chat event:', err);
      }
    });
  }, [getRetryInterval]);

  // stop SSE connection and clear retry timers
  const stopSSEConnection = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    retryCountRef.current = 0;
  }, []);

  // subscribe to processing events for a specific CID
  const subscribeToProcessing = useCallback(
    (cid: string, callback: ProcessingCallback) => {
      // add subscriber
      const subscribers = subscribersRef.current.get(cid) || new Set();
      subscribers.add(callback);
      subscribersRef.current.set(cid, subscribers);

      // returns unsubscribe function
      return () => {
        const subscribers = subscribersRef.current.get(cid);
        if (subscribers) {
          subscribers.delete(callback);
          if (subscribers.size === 0) {
            subscribersRef.current.delete(cid);
          }
        }
      };
    },
    []
  );

  const subscribeToChatEvents = useCallback((callback: ChatCallback) => {
    chatSubscribersRef.current.add(callback);

    return () => {
      chatSubscribersRef.current.delete(callback);
    };
  }, []);

  // start SSE connection automatically when provider mounts
  useEffect(() => {
    startSSEConnection();
  }, [startSSEConnection]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      stopSSEConnection();
    };
  }, [stopSSEConnection]);

  return (
    <InstanceContext.Provider
      value={{
        instanceInfo,
        loading,
        error,
        subscribeToProcessing,
        processingStatus,
        subscribeToChatEvents,
      }}
    >
      {children}
    </InstanceContext.Provider>
  );
}

export function useInstance() {
  const context = useContext(InstanceContext);
  if (context === undefined) {
    throw new Error('useInstance must be used within a InstanceProvider');
  }
  return context;
}
