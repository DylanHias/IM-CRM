'use client';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { PageMotion } from './PageMotion';
import styled from 'styled-components';

const Shell = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: hsl(var(--background));
  transition: background-color 0.2s ease;
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

interface Breadcrumb {
  label: string;
  href?: string;
}

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Breadcrumb[];
}

export function AppShell({ children, title, breadcrumbs }: AppShellProps) {
  return (
    <Shell>
      <Sidebar />
      <Main>
        <TopBar title={title} breadcrumbs={breadcrumbs} />
        <Content>
          <PageMotion>{children}</PageMotion>
        </Content>
      </Main>
    </Shell>
  );
}
