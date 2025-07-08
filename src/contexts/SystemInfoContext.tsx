'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getWebProxyUrl } from '@/lib/hooya-api-client';

export interface SystemInfo {
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

interface SystemInfoContextType {
  systemInfo: SystemInfo | null;
  loading: boolean;
  error: string | null;
}

const SystemInfoContext = createContext<SystemInfoContextType | undefined>(
  undefined
);

export function SystemInfoProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        setSystemInfo({
          ...data,
          short_id: shortId,
        });
        setError(null);
      } catch (err) {
        console.error('Failed to fetch system info:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSystemInfo();
  }, []);

  return (
    <SystemInfoContext.Provider value={{ systemInfo, loading, error }}>
      {children}
    </SystemInfoContext.Provider>
  );
}

export function useSystemInfo() {
  const context = useContext(SystemInfoContext);
  if (context === undefined) {
    throw new Error('useSystemInfo must be used within a SystemInfoProvider');
  }
  return context;
}
