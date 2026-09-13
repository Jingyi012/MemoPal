import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CreditText as Text } from '@/features/ai-credits/components/CreditText';
import { isTerminalCreditError } from '@/features/ai-credits/api/creditErrors';
import * as Crypto from 'expo-crypto';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/core/i18n/useTranslation';
import AnimatedPressable from '@/components/AnimatedPressable';
import { aiCreditsApi, type NumberPegImageInput } from '@/features/ai-credits/api/aiCredits.api';
import { useAiGenerations } from '@/features/ai-credits/hooks/useAiCredits';
import { useAiCreditConfirmation } from '@/features/ai-credits/hooks/useAiCreditConfirmation';
import { AiGeneratedImage } from '@/features/ai-credits/components/AiGeneratedImage';
import { getNumberPegErrorMessage } from '../utils/numberPegErrors';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { ImagePlus } from 'lucide-react-native';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';

type Props = {
  input: NumberPegImageInput; imagePath?: string; imageStory?: string; jobId?: string; disabled: boolean;
  onJob: (id: string) => void; onAdopt: (path: string, story: string) => void; onRemove: () => void;
};
export function NumberPegImageEditor({ input, imagePath, imageStory, jobId, disabled, onJob, onAdopt, onRemove }: Props) {
  const { language } = useTranslation('numberPeg');
  const zh = language === 'zh';
  const { styles, theme } = useStyles();
  const { canShowRequestErrors } = useNetworkStatus();
  const { balance, confirm } = useAiCreditConfirmation();
  const generations = useAiGenerations();
  const client = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const startingRef = useRef(false);
  const retry = useRef<{ input: string; id: string; maxCredits: number } | null>(null);
  const job = generations.data?.find((x) => x.id === jobId);
  const result = job?.status === 'completed' && job.resultJson
    ? JSON.parse(job.resultJson) as { sceneAssetUrl: string; story: string } : null;
  const pending = starting || Boolean(jobId && (!job || ['reserved', 'processing'].includes(job.status)));
  if (!imagePath && !pending && !result && !job?.status && !balance.data) return null;
  const generate = async () => {
    if (startingRef.current || disabled || pending) return;
    startingRef.current = true;
    setStarting(true);
    setError(null);
    try {
      const fingerprint = JSON.stringify(input);
      if (retry.current?.input !== fingerprint) {
        // Image generation is an explicit button action, so validate the wallet
        // and reserve the current price without showing a second confirmation.
        const approval = await confirm(1, true, false);
        if (!approval) return;
        retry.current = { input: fingerprint, id: Crypto.randomUUID(), maxCredits: approval.maxCredits };
      }
      const response = await aiCreditsApi.generateImage(retry.current.id, input, retry.current.maxCredits);
      onJob(response.id);
      retry.current = null;
      await client.invalidateQueries({ queryKey: ['ai-credits'] });
    } catch (e) {
      if (isTerminalCreditError(e)) retry.current = null;
      setError(getNumberPegErrorMessage(e, zh ? '图片生成失败，请重试。' : 'Could not generate an image. Please retry.'));
    }
    finally { startingRef.current = false; setStarting(false); }
  };
  return <View style={styles.container}>
    {imagePath && <>
      <AiGeneratedImage path={imagePath} description={imageStory ?? input.story} />
      {imageStory !== input.story && <Text>{zh ? '故事已更改，图片可能不匹配。可保留或重新生成。' : 'The story changed. Keep this illustration or generate a new one.'}</Text>}
      <AnimatedPressable disabled={disabled} onPress={onRemove} style={styles.secondaryAction}><Text style={styles.secondaryText}>{zh ? '移除图片' : 'Remove illustration'}</Text></AnimatedPressable>
    </>}
    {pending && <Text>{zh
      ? '图片生成中，请先留在当前页面。当前 memory set 尚未保存，离开后可能无法恢复。'
      : 'Creating your illustration. Please stay on this page. This memory set is not saved yet and may not be recoverable if you leave.'}</Text>}
    {job?.status === 'failed' && <Text>{zh ? '图片生成失败，未扣费。' : 'Image generation failed. No credits charged.'}</Text>}
    {result && result.sceneAssetUrl !== imagePath && <>
      <Text>{zh ? '新图片预览' : 'New illustration preview'}</Text>
      <AiGeneratedImage path={result.sceneAssetUrl} description={result.story} />
      <AnimatedPressable disabled={disabled} onPress={() => onAdopt(result.sceneAssetUrl, result.story)} style={styles.primaryAction}>
        <Text style={styles.primaryText}>{zh ? '采用图片' : 'Use illustration'}</Text>
      </AnimatedPressable>
    </>}
    {!imagePath && !pending && !result && !balance.data?.imagesEnabled ? (
      <View style={styles.unavailableBlock}>
        <ImagePlus size={17} color={theme.inkMuted} />
        <Text style={styles.unavailableText}>{zh
          ? balance.data?.imagesConfigured
            ? 'Visualize 图片功能暂未开启'
            : 'Visualize 尚未完成图片模型配置'
          : balance.data?.imagesConfigured
            ? 'Visualize is turned off'
            : 'Visualize needs an image model and API key'}</Text>
      </View>
    ) : (
      <View style={styles.visualizeBlock}>
        <View style={styles.visualizeHeader}>
          <View style={styles.visualizeIcon}><ImagePlus size={17} color={theme.violetDeep} /></View>
          <View style={styles.visualizeCopy}>
            <Text style={styles.visualizeTitle}>{zh ? 'Visualize 这句联想' : 'Visualize this story'}</Text>
            <Text style={styles.visualizeHint}>{zh ? '把当前联想句子变成一张记忆图片' : 'Turn the current association into a memory image'}</Text>
          </View>
        </View>
        <AnimatedPressable disabled={disabled || pending || !balance.data?.imagesEnabled} onPress={() => void generate()} style={styles.primaryAction}>
          <Text style={styles.primaryText}>{zh ? '生成联想图片' : 'Generate image'} · {balance.data?.imageCost ?? '…'} credits</Text>
        </AnimatedPressable>
      </View>
    )}
    {canShowRequestErrors && generations.isError && <AnimatedPressable onPress={() => void generations.refetch()} style={{ minHeight: 44 }}><Text>{zh ? '无法读取状态，点击重试' : 'Could not load status. Tap to retry.'}</Text></AnimatedPressable>}
    {error && <Text accessibilityRole="alert">{error}</Text>}
  </View>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  container: { gap: 8, marginTop: 14, marginBottom: 2 },
  primaryAction: { minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, backgroundColor: theme.violetDeep },
  primaryText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  secondaryAction: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  visualizeBlock: { gap: 9, marginTop: 5, padding: 12, borderRadius: 14, backgroundColor: theme.paper, borderWidth: 1.5, borderColor: theme.violetLine },
  visualizeHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  visualizeIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.violetTint },
  visualizeCopy: { flex: 1, minWidth: 0 },
  visualizeTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  visualizeHint: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10, lineHeight: 15, marginTop: 1 },
  unavailableBlock: { minHeight: 40, marginTop: 5, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.canvas, borderWidth: 1, borderColor: theme.line },
  unavailableText: { color: theme.inkMuted, fontFamily: typography.bodySemibold, fontSize: 10 },
}));
