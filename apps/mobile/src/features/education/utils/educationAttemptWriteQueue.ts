export type EducationAttemptWriteQueue = { current: Promise<void> };

export function enqueueEducationAttemptWrite<T>(
  queue: EducationAttemptWriteQueue,
  write: () => Promise<T>,
): Promise<T> {
  const operation = queue.current.then(write);
  queue.current = operation.then(() => undefined, () => undefined);
  return operation;
}
