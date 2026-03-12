'use client';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import styled from 'styled-components';

const Shell = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: #f8fafc;
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

export function AppShell({ children, title }: AppShellProps) {
  return (
    <Shell>
      <Sidebar />
      <Main>
        <TopBar title={title} />
        <Content>{children}</Content>
      </Main>
    </Shell>
  );
}
