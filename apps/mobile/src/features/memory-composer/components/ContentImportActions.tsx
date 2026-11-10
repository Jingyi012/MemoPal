import { View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { ClipboardList, ScanText } from '@/core/icons';

type ImportAction = {
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
};

/** Shared intake controls; the destination editor owns its content and validation. */
export function ContentImportActions({ paste, scan, disabled = false }: {
  paste: ImportAction;
  scan: ImportAction;
  disabled?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 8 }}>
      <AppButton {...paste} icon={ClipboardList} variant="secondary" size="compact"
        disabled={disabled} labelStyle={{ flexShrink: 1 }} style={{ flex: 1, minWidth: 0, paddingVertical: 10 }} />
      <AppButton {...scan} icon={ScanText} variant="secondary" size="compact"
        disabled={disabled} labelStyle={{ flexShrink: 1 }} style={{ flex: 1, minWidth: 0, paddingVertical: 10 }} />
    </View>
  );
}
