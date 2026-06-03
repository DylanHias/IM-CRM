'use client';

import { AdminGuard } from '@/components/admin/AdminGuard';
import { AiChat } from '@/components/ai-chat';

export default function AiAssistantPage() {
  return (
    <AdminGuard>
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-semibold">AI Assistant</h2>
          <p className="text-sm text-muted-foreground">
            Your private, on-device assistant for navigating the CRM and looking up your data.
          </p>
        </div>
        <AiChat />
      </div>
    </AdminGuard>
  );
}
