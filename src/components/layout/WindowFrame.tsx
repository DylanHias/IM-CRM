'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Minus, Square, X, Copy } from 'lucide-react';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import styled from 'styled-components';

const Bar = styled.div`
  height: 38px;
  background-color: hsl(var(--titlebar-bg));
  display: flex;
  align-items: center;
  flex-shrink: 0;
  z-index: 60;
  -webkit-app-region: drag;
  app-region: drag;
`;

const LeftSection = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  gap: 8px;
  padding-left: 14px;
  height: 100%;
  min-width: 0;
`;

const AppTitle = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--titlebar-fg));
  white-space: nowrap;
  letter-spacing: 0.01em;
`;

/* The section itself drags, so its empty space moves the window; the
   controls inside opt out. */
const CenterSection = styled.div`
  display: flex;
  align-items: center;
  height: 100%;

  > * {
    -webkit-app-region: no-drag;
    app-region: no-drag;
  }
`;

const RightSection = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  height: 100%;
  min-width: 0;

  > * {
    -webkit-app-region: no-drag;
    app-region: no-drag;
  }
`;

const WindowControls = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  margin-left: 8px;
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
  transition: background-color 0.12s ease, color 0.12s ease;

  &:hover {
    background-color: ${(p) =>
      p.$variant === 'close'
        ? 'hsl(6 75% 44%)'
        : 'hsl(var(--chrome-hover))'};
    color: ${(p) =>
      p.$variant === 'close' ? 'white' : 'hsl(var(--titlebar-fg))'};
  }

  &:active {
    background-color: ${(p) =>
      p.$variant === 'close'
        ? 'hsl(6 75% 38%)'
        : 'hsl(var(--chrome-selected))'};
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
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  children?: React.ReactNode;
}

export function WindowFrame({ leftContent, centerContent, children }: WindowFrameProps) {
  const { isMaximized, minimize, toggleMaximize, close } = useWindowControls();

  return (
    <Bar data-tauri-drag-region>
      <LeftSection data-tauri-drag-region>
        <Image
          src="/images/icon.png"
          alt="Ingram Micro CRM"
          width={18}
          height={18}
          className="rounded-sm"
          data-tauri-drag-region
        />
        <AppTitle data-tauri-drag-region>Ingram Micro CRM</AppTitle>
        {leftContent}
      </LeftSection>

      {centerContent && <CenterSection data-tauri-drag-region>{centerContent}</CenterSection>}

      <RightSection data-tauri-drag-region>
        {children}
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
