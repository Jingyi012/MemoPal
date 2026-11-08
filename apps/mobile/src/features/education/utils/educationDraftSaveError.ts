/** Translate expected save failures without exposing raw server traces or payloads. */
export function educationDraftSaveError(error: unknown, zh: boolean): string {
  const fallback = zh ? '保存失败，内容仍保留，请重试。' : 'Could not save. Your content is still here; please retry.';
  if (!error || typeof error !== 'object') return fallback;
  const failure = error as { code?: unknown; response?: { status?: number; data?: { errors?: Record<string, unknown>; message?: unknown } } };
  const status = failure.response?.status;
  const errors = failure.response?.data?.errors;
  if (status === 400 && errors && typeof errors === 'object' && 'Entries' in errors) {
    return zh ? '学习服务尚未支持按单元保存。请更新服务后重试，内容仍保留。'
      : 'The learning service needs an update to save units. Update it and retry; your content is still here.';
  }
  if (failure.code === 'ECONNABORTED' || failure.code === 'ETIMEDOUT') return zh
    ? '保存超时。请检查网络后重试，内容仍保留。' : 'Saving timed out. Check your connection and retry; your content is still here.';
  if (failure.code === 'ERR_NETWORK') return zh
    ? '无法连接学习服务。请检查网络后重试，内容仍保留。' : 'Cannot reach the learning service. Check your connection and retry; your content is still here.';
  if (status === 403) return zh ? '当前账号没有创建学习内容的权限。' : 'This account cannot create study content.';
  if (status === 409) return zh ? '原草稿已被移除或暂不可用。请修改名称后重试。' : 'The original draft is unavailable. Change the name and retry.';
  if (status === 400) return zh ? '请检查单元名称、空单元和重复词语后重试。内容仍保留。' : 'Check unit names, empty units and duplicate words, then retry. Your content is still here.';
  return fallback;
}
