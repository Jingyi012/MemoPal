import AnimatedPressable from '@/components/AnimatedPressable';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { Colors } from '@/constants/colors';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Ticket } from 'lucide-react-native';
import React, { forwardRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

type Ref = BottomSheetModal;

interface Props {
  isFinding: boolean;
  onFind: (shareCode: string) => Promise<void> | void;
}

const ShareCodeBottomSheet = forwardRef<Ref, Props>(({ isFinding, onFind }, ref) => {
  const [shareCode, setShareCode] = useState('');

  return (
    <CustomBottomSheetModal ref={ref} snapPoints={['35%']} enableDynamicSizing={false}>
      <View className="flex-1 px-6 pb-6 pt-3">
        <Text className="text-xl font-extrabold text-slate-900">Find by Share Code</Text>
        <Text className="mt-1 text-sm text-slate-500">
          Paste a lesson code to quickly open its preview.
        </Text>

        <View className="mt-4 flex-row items-center rounded-lg bg-gray-100 px-3 py-1">
          <Ticket size={20} color={Colors.slate400} />
          <TextInput
            className="flex-1"
            placeholder="Paste share code..."
            placeholderTextColor={Colors.slate400}
            value={shareCode}
            autoCapitalize="characters"
            autoCorrect={false}
            onChangeText={setShareCode}
            onSubmitEditing={() => onFind(shareCode)}
          />
        </View>

        <AnimatedPressable
          onPress={() => onFind(shareCode)}
          disabled={isFinding || !shareCode.trim()}
          className={`mt-4 h-12 items-center justify-center rounded-xl ${
            isFinding || !shareCode.trim() ? 'bg-slate-300' : 'bg-teal-600'
          }`}>
          <Text className="font-bold text-white">{isFinding ? 'Finding...' : 'Find Lesson'}</Text>
        </AnimatedPressable>
      </View>
    </CustomBottomSheetModal>
  );
});

ShareCodeBottomSheet.displayName = 'ShareCodeBottomSheet';

export default ShareCodeBottomSheet;
