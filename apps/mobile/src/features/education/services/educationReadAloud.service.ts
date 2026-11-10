import { createReadAloudPlayer } from '../utils/educationReadAloud';

// Load only after an explicit tap; an older dev client can lack the native module.
export const educationReadAloud = createReadAloudPlayer(() => import('expo-speech'));
