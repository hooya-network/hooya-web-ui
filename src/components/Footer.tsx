'use client';

import { useSystemInfo } from '@/contexts/SystemInfoContext';

export default function Footer() {
  const { systemInfo } = useSystemInfo();

  return (
    <footer id="page-footer">
      <ul className="slash-flat-list">
        <li>{systemInfo?.daemon_version?.version_string || 'Loading...'}</li>
        <li>{systemInfo?.webui_version?.version_string || 'Loading...'}</li>
        <li>Operated by {systemInfo?.operator_name || 'Loading...'}</li>
      </ul>
      <ul className="emdash-flat-list">
        <li>
          <a href="https://github.com/hooya-network">Github</a>
        </li>
        <li>
          <a href="https://twitter.com/hooyanetwork">Twitter</a>
        </li>
      </ul>
    </footer>
  );
}
