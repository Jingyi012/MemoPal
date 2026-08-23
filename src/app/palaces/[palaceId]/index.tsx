import { PalaceDetailsScreen as PalaceDetailScreen } from '@/features/palace';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

const PalaceDetails = () => {
  const { palaceId } = useLocalSearchParams();

  return <PalaceDetailScreen palaceId={palaceId as string} />;
};

export default PalaceDetails;
