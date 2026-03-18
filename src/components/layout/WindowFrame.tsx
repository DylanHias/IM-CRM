'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Minus, Square, X, Copy } from 'lucide-react';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import styled from 'styled-components';

const Bar = styled.div`
  height: 36px;
  background-color: hsl(var(--titlebar-bg));
  display: flex;
  align-items: center;
  flex-shrink: 0;
  z-index: 50;
  -webkit-app-region: drag;
  app-region: drag;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 12px;
  height: 100%;
`;

const AppTitle = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--titlebar-fg));
  white-space: nowrap;
  letter-spacing: 0.01em;
`;

const Spacer = styled.div`
  flex: 1;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  -webkit-app-region: no-drag;
  app-region: no-drag;
`;

const WindowControls = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;

const WindowButton = styled.button<{ $variant?: 'close' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 100%;
  border: none;
  background: transparent;
  color: hsl(var(--titlebar-fg));
  cursor: pointer;
  transition: background-color 0.1s ease;

  &:hover {
    background-color: ${(p) =>
      p.$variant === 'close'
        ? 'hsl(0 84% 60%)'
        : 'hsl(var(--titlebar-fg) / 0.08)'};
    color: ${(p) =>
      p.$variant === 'close' ? 'white' : 'hsl(var(--titlebar-fg))'};
  }

  &:active {
    background-color: ${(p) =>
      p.$variant === 'close'
        ? 'hsl(0 84% 50%)'
        : 'hsl(var(--titlebar-fg) / 0.12)'};
  }
`;

function useWindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);

  const updateMaximizedState = useCallback(async () => {
    if (!isTauriApp()) return;
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    setIsMaximized(await getCurrentWindow().isMaximized());
  }, []);

  useEffect(() => {
    updateMaximizedState();
  }, [updateMaximizedState]);

  useEffect(() => {
    if (!isTauriApp()) return;
    let unlisten: (() => void) | undefined;

    const setup = async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      unlisten = await getCurrentWindow().onResized(async () => {
        setIsMaximized(await getCurrentWindow().isMaximized());
      });
    };
    setup();

    return () => {
      unlisten?.();
    };
  }, []);

  const minimize = async () => {
    if (!isTauriApp()) return;
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().minimize();
  };

  const toggleMaximize = async () => {
    if (!isTauriApp()) return;
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().toggleMaximize();
    setIsMaximized(!(await getCurrentWindow().isMaximized()));
  };

  const close = async () => {
    if (!isTauriApp()) return;
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().close();
  };

  return { isMaximized, minimize, toggleMaximize, close };
}

interface WindowFrameProps {
  children?: React.ReactNode;
}

export function WindowFrame({ children }: WindowFrameProps) {
  const { isMaximized, minimize, toggleMaximize, close } = useWindowControls();

  return (
    <Bar data-tauri-drag-region>
      <LeftSection>
        <Image
          src="/images/icon.png"
          alt="Ingram Micro CRM"
          width={18}
          height={18}
          className="rounded-sm"
        />
        <AppTitle>Ingram Micro CRM</AppTitle>
      </LeftSection>

      <Spacer />

      {children && (
        <RightSection>
          {children}
        </RightSection>
      )}

      <RightSection>
        <WindowControls>
          <WindowButton onClick={minimize} title="Minimize">
            <Minus size={14} strokeWidth={1.5} />
          </WindowButton>
          <WindowButton onClick={toggleMaximize} title={isMaximized ? 'Restore' : 'Maximize'}>
            {isMaximized ? (
              <Copy size={12} strokeWidth={1.5} className="rotate-90" />
            ) : (
              <Square size={11} strokeWidth={1.5} />
            )}
          </WindowButton>
          <WindowButton $variant="close" onClick={close} title="Close">
            <X size={15} strokeWidth={1.5} />
          </WindowButton>
        </WindowControls>
      </RightSection>
    </Bar>
  );
}
