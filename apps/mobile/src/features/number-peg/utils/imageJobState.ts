// A cached text job or an old job while Visualize is disabled must not become an image error.
export function imageJobState(imagesEnabled: boolean, jobId: string | undefined,
  job: { id: string; kind: string; status: string } | undefined) {
  const matches = job?.id === jobId && job?.kind === 'number-peg-image';
  const visible = imagesEnabled && Boolean(jobId) && (!job || matches);
  return {
    visible,
    pending: visible && (!matches || job?.status === 'reserved' || job?.status === 'processing'),
    failed: visible && matches && job?.status === 'failed',
  };
}
