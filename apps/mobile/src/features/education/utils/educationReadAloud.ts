export type ReadingVoiceState = 'loading' | 'speaking' | 'idle' | 'error';
export type ReadingVoiceEngine = {
  stop: () => Promise<void>;
  maxSpeechInputLength: number;
  speak: (text: string, options: { language: string; rate: number; onStart: () => void; onDone: () => void; onStopped: () => void; onError: () => void }) => void;
};

/** One queue prevents an old card's asynchronous stop from interrupting a new card. */
export function createReadAloudPlayer(load: () => Promise<ReadingVoiceEngine>) {
  let revision = 0;
  let queue: Promise<void> = Promise.resolve();
  return {
    play(text: string, language: string, report: (state: ReadingVoiceState) => void) {
      const token = ++revision;
      const notify = (state: ReadingVoiceState) => { if (token === revision) report(state); };
      notify('loading');
      queue = queue.then(async () => {
        if (token !== revision) return;
        const engine = await load();
        if (token !== revision) return;
        await engine.stop();
        if (token !== revision) return;
        if (!text.trim() || text.length > engine.maxSpeechInputLength) throw new Error('Unsupported reading length');
        engine.speak(text, {
          language: language === 'zh-Hans' ? 'zh-CN' : language, rate: 0.85,
          onStart: () => notify('speaking'), onDone: () => notify('idle'),
          onStopped: () => notify('idle'), onError: () => notify('error'),
        });
      }).catch(() => notify('error'));
      return () => {
        if (token !== revision) return;
        revision++;
        queue = queue.then(async () => { const engine = await load(); await engine.stop(); }).catch(() => {});
      };
    },
  };
}
