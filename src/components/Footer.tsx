'use client';

import { useInstance } from '@/contexts/InstanceContext';

export default function Footer() {
  const { instanceInfo } = useInstance();

  return (
    <footer id="page-footer">
      <ul className="slash-flat-list">
        <li>{instanceInfo?.daemon_version?.version_string || 'Loading…'}</li>
        <li>{instanceInfo?.webui_version?.version_string || 'Loading…'}</li>
        <li>Operated by {instanceInfo?.operator_name || 'Loading…'}</li>
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
