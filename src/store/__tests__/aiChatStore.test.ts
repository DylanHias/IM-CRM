import { beforeEach, describe, expect, it } from 'vitest';
import { useAiChatStore } from '@/store/aiChatStore';

describe('aiChatStore', () => {
  beforeEach(() => {
    useAiChatStore.setState({
      messages: [],
      isStreaming: false,
      streamingContent: '',
    });
  });

  it('appends messages with generated id and timestamp', () => {
    useAiChatStore.getState().addMessage({ role: 'user', content: 'Hello' });
    const { messages } = useAiChatStore.getState();
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('Hello');
    expect(messages[0].id).toBeTruthy();
    expect(typeof messages[0].timestamp).toBe('number');
  });

  it('finalizes streaming content into an assistant message', () => {
    useAiChatStore.setState({ isStreaming: true, streamingContent: 'Streamed answer' });
    useAiChatStore.getState().finalizeStreaming();
    const { messages, isStreaming, streamingContent } = useAiChatStore.getState();
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ role: 'assistant', content: 'Streamed answer' });
    expect(isStreaming).toBe(false);
    expect(streamingContent).toBe('');
  });

  it('does not add a message when finalizing empty streaming content', () => {
    useAiChatStore.setState({ isStreaming: true, streamingContent: '' });
    useAiChatStore.getState().finalizeStreaming();
    const { messages, isStreaming } = useAiChatStore.getState();
    expect(messages).toHaveLength(0);
    expect(isStreaming).toBe(false);
  });

  it('clears all messages and streaming state', () => {
    useAiChatStore.getState().addMessage({ role: 'user', content: 'one' });
    useAiChatStore.setState({ isStreaming: true, streamingContent: 'partial' });
    useAiChatStore.getState().clearMessages();
    const { messages, isStreaming, streamingContent } = useAiChatStore.getState();
    expect(messages).toHaveLength(0);
    expect(isStreaming).toBe(false);
    expect(streamingContent).toBe('');
  });
});
