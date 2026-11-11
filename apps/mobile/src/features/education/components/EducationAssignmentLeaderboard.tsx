import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import { useEducationAssignmentLeaderboard } from '@/features/education/hooks/useEducationAssignmentLeaderboard';
import { useEducationCopy } from '@/features/education/i18n';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

type EducationAssignmentLeaderboardProps = Readonly<{
  assignmentId: string;
  resultsPublishedAt: string | null;
  enabled: boolean;
}>;

export function EducationAssignmentLeaderboard({ assignmentId, resultsPublishedAt, enabled }: EducationAssignmentLeaderboardProps) {
  const copy = useEducationCopy();
  const query = useEducationAssignmentLeaderboard(assignmentId, resultsPublishedAt, enabled);
  const { styles, theme } = useStyles();
  if (!enabled || query.isError) return null;
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{copy.classRankTitle}</Text>
      {query.isLoading || !query.data ? (
        <ActivityIndicator color={theme.violetDeep} />
      ) : (
        <>
          {query.data.myRank === null ? (
            <Text style={styles.body}>{copy.classRankNotRanked}</Text>
          ) : (
            <Text style={styles.rank}>{copy.classRank(query.data.myRank)}</Text>
          )}
          {query.data.myScore !== null && query.data.maxScore !== null ? (
            <Text style={styles.body}>{copy.classRankScore(query.data.myScore, query.data.maxScore)}</Text>
          ) : null}
          <Text style={styles.body}>{copy.classRankParticipants(query.data.rankedParticipantCount, query.data.assignedParticipantCount)}</Text>
          {query.data.fullLeaderboardEnabled && query.data.visibleEntries.length > 0 ? (
            <View style={styles.entries}>
              {query.data.visibleEntries.map((entry) => (
                <Text key={`${entry.rank}-${entry.alias}`} style={[styles.entry, entry.isMe && styles.myEntry]}>
                  {copy.classLeaderboardEntry(entry.rank, entry.alias, entry.score, entry.maxScore)}
                </Text>
              ))}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { backgroundColor: theme.skyTint, borderColor: theme.skyLine, borderRadius: appRadii.control, borderWidth: 1.5, gap: 6, padding: 14 },
  title: { color: theme.link, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.label.fontSize },
  rank: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.prompt.fontSize },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight },
  entries: { borderTopColor: theme.skyLine, borderTopWidth: 1, gap: 5, marginTop: 5, paddingTop: appSpacing.sm },
  entry: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize },
  myEntry: { color: theme.ink, fontFamily: typography.bodyExtraBold },
}));
