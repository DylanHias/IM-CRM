'use client';

import { Sidebar } from './Sidebar';
import { TitleBar } from './TitleBar';
import { PageMotion } from './PageMotion';
import { ChangelogDialog } from './ChangelogDialog';
import { useSettingsStore } from '@/store/settingsStore';
import { cn } from '@/lib/utils';
import styled from 'styled-components';

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: hsl(var(--background));
  transition: background-color 0.2s ease;
`;

const Body = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: hsl(var(--background));
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;

  .compact & {
    padding: 16px 20px;
  }
`;

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const compactMode = useSettingsStore((s) => s.compactMode);

  return (
    <Shell className={cn(compactMode && 'compact')}>
      <TitleBar />
      <Body>
        <Sidebar />
        <Main>
          <Content>
            <PageMotion>{children}</PageMotion>
          </Content>
        </Main>
      </Body>
      <ChangelogDialog />
    </Shell>
  );
}
