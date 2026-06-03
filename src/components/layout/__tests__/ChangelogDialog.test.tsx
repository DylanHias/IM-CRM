import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ChangelogDialog } from '../ChangelogDialog';

const BODY = [
  '**v2.13.1**',
  '- Added: brand new thing',
  '',
  '**v2.13.0**',
  '- Added: the AI assistant',
  '',
  '**v2.12.74**',
  '- Fixed: an old bug',
].join('\n');

function seed(body: string, version: string, fromVersion?: string) {
  localStorage.setItem('pending-changelog', body);
  localStorage.setItem('pending-changelog-version', version);
  if (fromVersion) localStorage.setItem('pending-changelog-from', fromVersion);
}

afterEach(() => localStorage.clear());

describe('ChangelogDialog', () => {
  it('shows only versions newer than the one updated from', async () => {
    seed(BODY, '2.13.1', '2.13.0');
    render(<ChangelogDialog />);

    await waitFor(() => expect(screen.getByText('Added: brand new thing')).toBeInTheDocument());
    expect(screen.queryByText('Added: the AI assistant')).not.toBeInTheDocument();
    expect(screen.queryByText('Fixed: an old bug')).not.toBeInTheDocument();
  });

  it('shows all versions when no fromVersion is recorded (backward compat)', async () => {
    seed(BODY, '2.13.1');
    render(<ChangelogDialog />);

    await waitFor(() => expect(screen.getByText('Added: brand new thing')).toBeInTheDocument());
    expect(screen.getByText('Added: the AI assistant')).toBeInTheDocument();
    expect(screen.getByText('Fixed: an old bug')).toBeInTheDocument();
  });
});
