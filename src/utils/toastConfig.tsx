import { AlertCircle, CheckCircle2, Info } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { ToastConfig } from 'react-native-toast-message';

export const toastConfig: ToastConfig = {
  success: ({ text1, text2 }) => (
    <View className="mx-4 w-[90%] flex-row items-center rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
      <CheckCircle2 size={24} color="#059669" />
      <View className="ml-3 flex-1">
        <Text className="text-[15px] font-bold leading-tight text-emerald-900">{text1}</Text>
        {text2 && <Text className="mt-0.5 text-sm text-emerald-700">{text2}</Text>}
      </View>
    </View>
  ),

  error: ({ text1, text2 }) => (
    <View className="mx-4 w-[90%] flex-row items-center rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
      <AlertCircle size={24} color="#dc2626" />
      <View className="ml-3 flex-1">
        <Text className="text-[15px] font-bold leading-tight text-red-900">{text1}</Text>
        {text2 && <Text className="mt-0.5 text-sm text-red-700">{text2}</Text>}
      </View>
    </View>
  ),

  info: ({ text1, text2 }) => (
    <View className="mx-4 w-[90%] flex-row items-center rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
      <Info size={24} color="#2563eb" />
      <View className="ml-3 flex-1">
        <Text className="text-[15px] font-bold leading-tight text-blue-900">{text1}</Text>
        {text2 && <Text className="mt-0.5 text-sm text-blue-700">{text2}</Text>}
      </View>
    </View>
  ),
};
