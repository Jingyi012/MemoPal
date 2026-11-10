import EducationPersonalCoursesScreen from './EducationPersonalCoursesScreen';

/** Keep existing saved-course links pointing at the shared learning library. */
export default function EducationSavedCoursesScreen() {
  return <EducationPersonalCoursesScreen initialFilter="saved" />;
}
