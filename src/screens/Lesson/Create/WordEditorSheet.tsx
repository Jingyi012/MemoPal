import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { Colors } from '@/constants/colors';
import { LessonWordForm } from '@/types/lesson';
import { Location } from '@/types/palace';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { Check, X } from 'lucide-react-native';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Keyboard, Text, View } from 'react-native';

export interface WordEditorSheetRef {
  open: (payload: { location: Location; existingWord?: LessonWordForm }) => void;
  close: () => void;
}

interface Props {
  onConfirm: (locationId: string, text: string, meaning?: string) => void;
}

export const WordEditorSheet = forwardRef<WordEditorSheetRef, Props>(({ onConfirm }, ref) => {
  const modalRef = useRef<BottomSheetModal>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [text, setText] = useState('');
  const [meaning, setTranslation] = useState('');

  React.useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidHide', () => {
      modalRef.current?.snapToIndex(0);
    });

    return () => sub.remove();
  }, []);

  const snapPoints = useMemo(() => ['80%'], []);

  useImperativeHandle(ref, () => ({
    open: ({ location, existingWord }) => {
      setLocation(location);
      setText(existingWord?.text ?? '');
      setTranslation(existingWord?.meaning ?? '');
      modalRef.current?.present();
    },
    close: () => modalRef.current?.dismiss(),
  }));

  const canConfirm = text.trim().length > 0;

  const handleConfirm = () => {
    if (!canConfirm || !location) return;
    onConfirm(location.id, text.trim(), meaning.trim());
    modalRef.current?.dismiss();
  };

  const handleDismiss = () => {
    setLocation(null);
    setText('');
    setTranslation('');
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={snapPoints}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore">
      <BottomSheetView className="px-6 pb-10">
        {location && (
          <>
            {/* Header */}
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-black text-slate-900">{location.name}</Text>
                <Text className="font-medium italic text-slate-400">Memory Spot</Text>
              </View>

              <AnimatedPressable
                onPress={() => modalRef.current?.dismiss()}
                className="h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                <X size={18} color={Colors.slate400} />
              </AnimatedPressable>
            </View>

            {/* Image Preview */}
            <View className="relative mb-6 h-40 w-full overflow-hidden rounded-3xl bg-slate-200">
              <AppImage source={{ uri: location.imageUrl }} className="h-full w-full" />
            </View>

            {/* Inputs */}
            <View className="space-y-3">
              <View>
                <Text className="mb-2 ml-1 text-xs font-black uppercase tracking-widest text-slate-400">
                  Word
                </Text>
                <BottomSheetTextInput
                  value={text}
                  onChangeText={setText}
                  autoFocus
                  placeholder="What are you placing here?"
                  placeholderTextColor={Colors.slate500}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-lg font-bold text-slate-900 focus:border-teal-500"
                />
              </View>

              <View className="mt-3">
                <Text className="mb-2 ml-1 text-xs font-black uppercase tracking-widest text-slate-400">
                  Meaning (Optional)
                </Text>
                <BottomSheetTextInput
                  value={meaning}
                  onChangeText={setTranslation}
                  placeholder="Meaning in your language..."
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-slate-900 focus:border-teal-500"
                />
              </View>
            </View>

            {/* Confirm */}
            <AnimatedPressable
              disabled={!canConfirm}
              onPress={handleConfirm}
              className={`mt-8 flex-row items-center justify-center gap-2 rounded-2xl py-4 shadow-lg ${
                canConfirm ? 'bg-teal-600 shadow-teal-600/30' : 'bg-slate-200'
              }`}>
              {canConfirm && <Check size={20} color="white" />}
              <Text className="text-lg font-black text-white">Confirm</Text>
            </AnimatedPressable>
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});
