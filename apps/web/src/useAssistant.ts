import { useEffect, useRef, useState } from 'react';
import type { Answer } from '@evidence/core';
import type { AssistantClient } from './api.js';

export type RequestState =
  | { status: 'idle' | 'loading' | 'error' }
  | { status: 'success'; answer: Answer };
export function useAssistant(client: AssistantClient) {
  const [state, setState] = useState<RequestState>({ status: 'idle' });
  const [available, setAvailable] = useState(false);
  const current = useRef<{ id: number; controller: AbortController } | null>(
    null,
  );
  const sequence = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    client
      .config(controller.signal)
      .then((config) => {
        if (!controller.signal.aborted) setAvailable(config.llmAvailable);
      })
      .catch(() => {});
    return () => {
      controller.abort();
      current.current?.controller.abort();
    };
  }, [client]);
  const cancel = () => {
    sequence.current++;
    current.current?.controller.abort();
    current.current = null;
    setState({ status: 'idle' });
  };
  const submit = async (question: string, mode: 'demo' | 'llm') => {
    current.current?.controller.abort();
    const id = ++sequence.current;
    const controller = new AbortController();
    current.current = { id, controller };
    setState({ status: 'loading' });
    try {
      const answer = await client.ask({ question, mode }, controller.signal);
      if (sequence.current === id && !controller.signal.aborted)
        setState({ status: 'success', answer });
    } catch {
      if (sequence.current === id && !controller.signal.aborted)
        setState({ status: 'error' });
    } finally {
      if (sequence.current === id) current.current = null;
    }
  };
  return { state, available, cancel, submit };
}
