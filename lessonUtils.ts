import { Lesson, SportSetting } from './types';

export const CUSTOM_LESSON_TYPE_ID = 'custom';

export const getCustomLessonTypeName = (lesson: Lesson) => lesson.customLessonTypeName?.trim() || '';

export const getLessonTypeDisplayName = (
  lesson: Lesson,
  sport?: SportSetting,
  fallback = 'N/D'
) => {
  if (lesson.lessonTypeId === CUSTOM_LESSON_TYPE_ID) {
    return getCustomLessonTypeName(lesson) || fallback;
  }

  return sport?.lessonTypes.find((lessonType) => lessonType.id === lesson.lessonTypeId)?.name || fallback;
};
