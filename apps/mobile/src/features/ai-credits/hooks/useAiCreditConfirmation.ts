import { useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useAiCredits } from './useAiCredits';

export function useAiCreditConfirmation() {
  const balance = useAiCredits();
  const { language } = useTranslation('numberPeg');
  const zh = language === 'zh';
  const confirm = useCallback(async (count: number, image = false, requireConfirmation = true) => {
    const refreshed = await balance.refetch();
    if (refreshed.error || !refreshed.data) throw new Error(zh ? '无法读取 AI credit，请重试。' : 'Could not load AI credits. Please retry.');
    const wallet = refreshed.data;
    const cost = count * (image ? wallet.imageCost : wallet.textCost);
    if (wallet.available < cost) throw new Error(zh ? 'AI credit 不足。可保留免费模板或自行编辑。' : 'Insufficient AI credits. Keep a free template or edit manually.');
    if (image && !wallet.imagesEnabled) throw new Error(zh ? '图片生成尚未开放。' : 'Image generation is not available yet.');
    if (!cost) return { maxCredits: 0 };
    if (!requireConfirmation) return { maxCredits: cost };
    const message = zh
      ? `本次最多使用 ${cost} credits，当前可用 ${wallet.available}。只按成功生成计费；失败和模板免费。成功生成后，即使未采用或离开页面仍会计费。`
      : `Up to ${cost} credits; ${wallet.available} available. Only successful AI results are charged; failures and templates are free. Completed results are charged even if unused or you leave the page.`;
    const approved = Platform.OS === 'web' ? window.confirm(message) : await new Promise<boolean>((resolve) => Alert.alert('AI credits', message, [
      { text: zh ? '取消' : 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: zh ? '生成' : 'Generate', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) }));
    return approved ? { maxCredits: cost } : null;
  }, [balance, zh]);
  return { balance, confirm };
}
