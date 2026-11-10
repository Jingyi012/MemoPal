import { Platform, TextInput } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

// Gorhom's blur handler uses currentlyFocusedInput, absent from RN Web's
// TextInput.State. Keep its keyboard integration on native platforms only.
export const AppSheetTextInput = Platform.OS === 'web' ? TextInput : BottomSheetTextInput;
