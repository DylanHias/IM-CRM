'use client';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { PageMotion } from './PageMotion';
import { ChangelogDialog } from './ChangelogDialog';
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
`;

interface BackLinkConfig {
  label: string;
  href: string;
}

interface AppShellProps {
  children: React.ReactNode;
  backLink?: BackLinkConfig;
}

export function AppShell({ children, backLink }: AppShellProps) {
  return (
    <Shell>
      <TopBar backLink={backLink} />
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
