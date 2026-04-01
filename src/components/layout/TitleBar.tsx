'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wifi, WifiOff, ArrowLeft } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WindowFrame } from './WindowFrame';
import styled from 'styled-components';

const NoDrag = styled.div`
  display: flex;
  align-items: center;
  -webkit-app-region: no-drag;
  app-region: no-drag;
`;

const AppControls = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding-right: 4px;
  -webkit-app-region: no-drag;
  app-region: no-drag;
`;

const BackLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  font-weight: 500;
  color: hsl(var(--titlebar-fg) / 0.6);
  text-decoration: none;
  transition: color 0.15s ease;
  white-space: nowrap;
  margin-left: 16px;

  &:hover {
    color: hsl(var(--titlebar-fg));
  }
`;

const StatusPill = styled.div<{ $online: boolean }>`
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 10.5px;
  font-weight: 500;
  color: ${(p) =>
    p.$online ? 'hsl(var(--success))' : 'hsl(var(--destructive))'};
  padding: 2px 7px;
  border-radius: 20px;
  background-color: ${(p) =>
    p.$online
      ? 'hsl(var(--success) / 0.08)'
      : 'hsl(var(--destructive) / 0.08)'};
`;

function useBackLink(): { label: string; href: string } | undefined {
  const pathname = usePathname();
  if (/^\/customers\/[^/]+\/?$/.test(pathname))
    return { label: 'All customers', href: '/customers' };
  return undefined;
}

export function TitleBar() {
  const backLink = useBackLink();
  const isOnline = useOnlineStatus();

  return (
    <WindowFrame
      leftContent={
        backLink ? (
          <NoDrag>
            <BackLink href={backLink.href}>
              <ArrowLeft size={12} />
              {backLink.label}
            </BackLink>
          </NoDrag>
        ) : undefined
      }
    >
      <AppControls>
        <StatusPill $online={isOnline}>
          {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
          {isOnline ? 'Online' : 'Offline'}
        </StatusPill>

      </AppControls>
    </WindowFrame>
  );
}
