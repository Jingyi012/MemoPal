import AnimatedPressable from '@/components/AnimatedPressable';
import { MemoryAvatar } from '@/components/MemoryAvatar';
import { Check, X } from '@/core/icons';
import type { AvatarDefinition } from '@/features/avatars/types/avatar';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

interface Props {
  visible: boolean;
  avatars: readonly AvatarDefinition[];
  currentLevel: number;
  selectedAvatarId?: string | null;
  language: string;
  title: string;
  description: string;
  lockedLabel: (level: number) => string;
  selectedLabel: string;
  closeLabel: string;
  onClose: () => void;
  onSelect: (avatar: AvatarDefinition) => void;
}

export function AvatarPickerModal({
  visible,
  avatars,
  currentLevel,
  selectedAvatarId,
  language,
  title,
  description,
  lockedLabel,
  selectedLabel,
  closeLabel,
  onClose,
  onSelect,
}: Props) {
  const { styles, theme } = useStyles();
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
            <AnimatedPressable accessibilityLabel={closeLabel} onPress={onClose} style={styles.closeButton}>
              <X color={theme.inkSoft} size={20} />
            </AnimatedPressable>
          </View>
          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {avatars.map((avatar) => {
              const unlocked = avatar.requiredLevel <= currentLevel;
              const selected = avatar.id === selectedAvatarId;
              const name = language === 'zh' ? avatar.titleZh : avatar.titleEn;
              return (
                <AnimatedPressable
                  accessibilityLabel={unlocked ? name : `${name}, ${lockedLabel(avatar.requiredLevel)}`}
                  containerStyle={styles.cardContainer}
                  disabled={!unlocked}
                  key={avatar.id}
                  onPress={() => onSelect(avatar)}
                  style={[styles.card, selected && styles.cardSelected, !unlocked && styles.cardLocked]}>
                  <View style={styles.preview}>
                    <MemoryAvatar avatar={avatar} locked={!unlocked} size={92} />
                    {selected ? <View style={styles.selectedMark}><Check color={theme.onAccent} size={13} strokeWidth={3} /></View> : null}
                  </View>
                  <Text numberOfLines={1} style={styles.name}>{name}</Text>
                  <Text style={[styles.level, unlocked && styles.unlockedLevel]}>
                    {unlocked ? (selected ? selectedLabel : `Lv. ${avatar.requiredLevel}`) : lockedLabel(avatar.requiredLevel)}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(26,20,49,0.5)' },
  sheet: { maxHeight: '84%', backgroundColor: theme.canvas, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
  headerCopy: { flex: 1 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 20 },
  description: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 17, marginTop: 4 },
  closeButton: { alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 12, backgroundColor: theme.paper },
  grid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 10 },
  cardContainer: { width: '48%', marginBottom: 10 },
  card: { width: '100%', alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderWidth: 1.5, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 8 },
  cardSelected: { borderColor: theme.violetDeep, backgroundColor: theme.violetTint },
  cardLocked: { opacity: 0.62 },
  preview: { position: 'relative', marginBottom: 7 },
  selectedMark: { position: 'absolute', right: -3, bottom: 0, width: 23, height: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.violetDeep, borderWidth: 2, borderColor: theme.paper },
  name: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 13, maxWidth: '100%' },
  level: { color: theme.inkMuted, fontFamily: typography.bodyExtraBold, fontSize: 10, marginTop: 3 },
  unlockedLevel: { color: theme.violetDeep },
}));
