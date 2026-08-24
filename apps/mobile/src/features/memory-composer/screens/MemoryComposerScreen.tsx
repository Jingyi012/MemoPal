import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import type { MemoryGoalType } from '@/features/memory-sets';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { Href, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Hash, MapPinned, Plus, Sparkles, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { suggestMemoryTitle } from '@/features/memory-composer/utils/composerParams';
import { buildTechniqueRoute, recommendTechnique, type TechniqueChoice } from '@/features/memory-composer/utils/techniqueRecommendation';

type ComposerStep = 'content' | 'technique';

const goals: { key: MemoryGoalType; label: string; emoji: string }[] = [
  { key: 'spelling', label: 'Spelling', emoji: '✏️' },
  { key: 'ordered-list', label: 'A list', emoji: '🛒' },
  { key: 'facts', label: 'Facts', emoji: '💡' },
  { key: 'custom', label: 'Something else', emoji: '✨' },
];

export default function MemoryComposerScreen() {
  const router = useRouter();
  const [step, setStep] = useState<ComposerStep>('content');
  const [title, setTitle] = useState('');
  const [goalType, setGoalType] = useState<MemoryGoalType>('spelling');
  const [newItem, setNewItem] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const recommendation = useMemo(() => recommendTechnique(goalType, items.length), [goalType, items.length]);

  const addItem = () => {
    const value = newItem.trim();
    if (!value) return;
    if (items.length >= 100) {
      setMessage('Keep a memory to 100 items or fewer so it stays comfortable to review.');
      return;
    }
    setItems((current) => [...current, value]);
    setNewItem('');
    setMessage(null);
  };

  const continueToTechniques = () => {
    if (!items.length) {
      setMessage('Add at least one thing to remember.');
      return;
    }
    if (!title.trim()) setTitle(suggestMemoryTitle(goalType, items));
    setMessage(null);
    setStep('technique');
  };

  const openTechnique = (technique: TechniqueChoice) => {
    router.push(buildTechniqueRoute(technique, title.trim(), goalType, items) as Href);
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <CommonHeader
        eyebrow="New session"
        title={step === 'content' ? 'Add your content' : 'Pick a technique'}
        description={step === 'content' ? 'A word, a fact, a date — anything short' : 'Based on your list, we have a suggestion'}
        backAction={() => (step === 'technique' ? setStep('content') : router.back())}
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.progressRow}>
          <View style={[styles.progressDot, step === 'content' && styles.progressDotActive]} />
          <View style={[styles.progressLine, step === 'technique' && styles.progressLineActive]} />
          <View style={[styles.progressDot, step === 'technique' && styles.progressDotActive]} />
        </View>

        {step === 'content' ? (
          <>
            <View style={styles.inputCard}>
              <View style={styles.cardIcon}><Sparkles size={19} color={theme.berryDeep} /></View>
              <Text style={styles.cardTitle}>Start with something useful</Text>
              <Text style={styles.cardBody}>Spelling words, grocery lists, dates, names, or a few facts all make great first memories.</Text>

              <Text style={styles.label}>Name this session <Text style={styles.optionalLabel}>optional</Text></Text>
              <TextInput
                value={title}
                onChangeText={(value) => { setTitle(value); setMessage(null); }}
                maxLength={200}
                placeholder="e.g. Monday spelling test"
                placeholderTextColor="#AAA7B5"
                style={styles.input}
              />

              <Text style={styles.label}>What is this for?</Text>
              <View style={styles.goalGrid}>
                {goals.map((goal) => {
                  const selected = goal.key === goalType;
                  return (
                    <AnimatedPressable
                      key={goal.key}
                      onPress={() => setGoalType(goal.key)}
                      style={[styles.goalChip, selected && styles.goalChipSelected]}>
                      <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                      <Text style={[styles.goalLabel, selected && styles.goalLabelSelected]}>{goal.label}</Text>
                    </AnimatedPressable>
                  );
                })}
              </View>

              <Text style={styles.label}>Add your items</Text>
              <View style={styles.addRow}>
                <TextInput
                  value={newItem}
                  onChangeText={setNewItem}
                  onSubmitEditing={addItem}
                  returnKeyType="done"
                  maxLength={500}
                  placeholder="Type a word or fact…"
                  placeholderTextColor="#AAA7B5"
                  style={[styles.input, styles.addInput]}
                />
                <AnimatedPressable accessibilityLabel="Add item" onPress={addItem} style={styles.addButton}>
                  <Plus size={21} color="white" />
                </AnimatedPressable>
              </View>

              <View style={styles.chipRow}>
                {items.map((item, index) => (
                  <View key={`${item}-${index}`} style={styles.itemChip}>
                    <View style={styles.itemChipNumber}><Text style={styles.itemChipNumberText}>{index + 1}</Text></View>
                    <Text numberOfLines={1} style={styles.itemChipText}>{item}</Text>
                    <AnimatedPressable
                      accessibilityLabel={`Remove ${item}`}
                      onPress={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      style={styles.itemChipRemove}>
                      <Trash2 size={13} color={theme.inkSoft} />
                    </AnimatedPressable>
                  </View>
                ))}
              </View>
              <Text style={styles.hint}>Leave the name blank and we’ll suggest one from your list.</Text>
            </View>

            {message && <MessageCard message={message} />}
            <AnimatedPressable onPress={continueToTechniques} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Continue</Text>
              <ArrowRight size={18} color={theme.ink} />
            </AnimatedPressable>
          </>
        ) : (
          <>
            <View style={styles.recommendationBanner}>
              <Text style={styles.recommendationEmoji}>✨</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.recommendationTitle}>Your suggested path</Text>
                <Text style={styles.recommendationBody}>You can always choose the other technique if it feels more natural.</Text>
              </View>
            </View>

            <TechniqueCard
              technique="number-peg"
              recommended={recommendation === 'number-peg'}
              onPress={() => openTechnique('number-peg')}
            />
            <TechniqueCard
              technique="palace"
              recommended={recommendation === 'palace'}
              onPress={() => openTechnique('palace')}
            />

            <AnimatedPressable onPress={() => setStep('content')} style={styles.changeButton}>
              <ArrowLeft size={16} color={theme.inkSoft} />
              <Text style={styles.changeButtonText}>Change my list</Text>
            </AnimatedPressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TechniqueCard({ technique, recommended, onPress }: { technique: TechniqueChoice; recommended: boolean; onPress: () => void }) {
  const isPeg = technique === 'number-peg';
  return (
    <AnimatedPressable onPress={onPress} style={[styles.techniqueCard, recommended && styles.techniqueCardRecommended]}>
      {recommended && <View style={styles.ribbon}><Text style={styles.ribbonText}>RECOMMENDED</Text></View>}
      <View style={styles.techniqueHead}>
        <View style={[styles.techniqueIcon, isPeg ? styles.pegIcon : styles.palaceIcon]}>
          {isPeg ? <Hash size={25} color={theme.berryDeep} /> : <MapPinned size={25} color={theme.violetDeep} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.techniqueName}>{isPeg ? 'Number Peg' : 'Memory Palace'}</Text>
          <Text style={styles.techniqueTag}>{isPeg ? 'Fast · one movie per item' : 'Spatial · walk-through'}</Text>
        </View>
        <ArrowRight size={18} color={theme.inkSoft} />
      </View>
      <Text style={styles.techniqueDescription}>
        {isPeg
          ? 'Each number has a fixed anchor image. Picture it doing something wild to your word to lock it in.'
          : 'Place each item at a spot in a room, then walk through it to recall everything in order.'}
      </Text>
      <View style={styles.bestForRow}>
        {(isPeg ? ['Short lists', 'Spelling words', 'Up to 10'] : ['Longer lists', 'Sequences', 'Visual rooms']).map((label) => (
          <Text key={label} style={styles.bestFor}>{label}</Text>
        ))}
      </View>
    </AnimatedPressable>
  );
}

function MessageCard({ message }: { message: string }) {
  return <View style={styles.messageCard}><Text style={styles.messageText}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 16, paddingBottom: 42 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.line },
  progressDotActive: { backgroundColor: theme.sunDeep, transform: [{ scale: 1.2 }] },
  progressLine: { width: 70, height: 2, backgroundColor: theme.line, marginHorizontal: 7 },
  progressLineActive: { backgroundColor: theme.sunDeep },
  inputCard: { backgroundColor: theme.paper, borderWidth: 2, borderColor: theme.line, borderRadius: 20, padding: 16, shadowColor: theme.ink, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 },
  cardIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0F4' },
  cardTitle: { color: theme.ink, fontSize: 17, fontWeight: '900', marginTop: 10 },
  cardBody: { color: theme.inkSoft, fontSize: 12, lineHeight: 18, fontWeight: '600', marginTop: 4 },
  label: { color: theme.ink, fontSize: 13, fontWeight: '900', marginTop: 18, marginBottom: 8 },
  optionalLabel: { color: theme.inkSoft, fontSize: 11, fontWeight: '700' },
  input: { minHeight: 49, borderRadius: 12, borderWidth: 2, borderColor: theme.line, backgroundColor: 'white', paddingHorizontal: 12, color: theme.ink, fontSize: 14, fontWeight: '700' },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  goalChip: { minWidth: '47%', flexGrow: 1, minHeight: 43, borderRadius: 12, borderWidth: 2, borderColor: theme.line, backgroundColor: 'white', paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  goalChipSelected: { borderColor: theme.sunDeep, backgroundColor: '#FFF7E0' },
  goalEmoji: { fontSize: 17 },
  goalLabel: { color: theme.inkSoft, fontSize: 12, fontWeight: '800' },
  goalLabelSelected: { color: theme.ink },
  addRow: { flexDirection: 'row', gap: 8 },
  addInput: { flex: 1 },
  addButton: { width: 49, minHeight: 49, borderRadius: 13, backgroundColor: theme.ink, alignItems: 'center', justifyContent: 'center' },
  chipRow: { gap: 7, marginTop: 12 },
  itemChip: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: theme.line, borderRadius: 12, backgroundColor: 'white', paddingHorizontal: 8 },
  itemChipNumber: { width: 20, height: 20, borderRadius: 10, backgroundColor: theme.sun, alignItems: 'center', justifyContent: 'center' },
  itemChipNumberText: { color: theme.ink, fontSize: 10, fontWeight: '900' },
  itemChipText: { flex: 1, color: theme.ink, fontSize: 13, fontWeight: '800' },
  itemChipRemove: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  hint: { color: theme.inkSoft, fontSize: 11, lineHeight: 16, textAlign: 'center', fontWeight: '600', marginTop: 12 },
  primaryButton: { minHeight: 53, marginTop: 16, borderRadius: 15, backgroundColor: theme.sun, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: theme.sunDeep, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  primaryButtonText: { color: theme.ink, fontSize: 15, fontWeight: '900' },
  messageCard: { marginTop: 13, borderRadius: 13, borderWidth: 1.5, borderColor: '#FFD2DC', backgroundColor: '#FFF0F4', padding: 11 },
  messageText: { color: theme.berryDeep, fontSize: 12, lineHeight: 17, textAlign: 'center', fontWeight: '800' },
  recommendationBanner: { flexDirection: 'row', gap: 11, borderRadius: 18, borderWidth: 1.5, borderColor: '#FFE6A3', backgroundColor: '#FFF7E0', padding: 14, marginBottom: 16 },
  recommendationEmoji: { fontSize: 27 },
  recommendationTitle: { color: theme.ink, fontSize: 14, fontWeight: '900' },
  recommendationBody: { color: theme.inkSoft, fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 3 },
  techniqueCard: { position: 'relative', borderWidth: 2, borderColor: theme.line, borderRadius: 20, backgroundColor: theme.paper, padding: 15, marginBottom: 13 },
  techniqueCardRecommended: { borderColor: theme.sunDeep, borderWidth: 2.5 },
  ribbon: { position: 'absolute', right: 13, top: -11, borderRadius: 999, backgroundColor: theme.sun, paddingHorizontal: 10, paddingVertical: 4, shadowColor: theme.ink, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  ribbonText: { color: theme.ink, fontSize: 10, fontWeight: '900', letterSpacing: 0.4 },
  techniqueHead: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  techniqueIcon: { width: 47, height: 47, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pegIcon: { backgroundColor: '#FFF0F4' },
  palaceIcon: { backgroundColor: '#EEE9FF' },
  techniqueName: { color: theme.ink, fontSize: 16, fontWeight: '900' },
  techniqueTag: { color: theme.inkSoft, fontSize: 11, fontWeight: '700', marginTop: 2 },
  techniqueDescription: { color: theme.inkSoft, fontSize: 12.5, lineHeight: 18, fontWeight: '600', marginTop: 10 },
  bestForRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  bestFor: { color: theme.inkSoft, fontSize: 10.5, fontWeight: '800', backgroundColor: 'white', borderWidth: 1.5, borderColor: theme.line, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  changeButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2 },
  changeButtonText: { color: theme.inkSoft, fontSize: 12, fontWeight: '800' },
});
