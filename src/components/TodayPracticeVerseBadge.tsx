import { useTranslation } from 'react-i18next';

import { SectionOrangeHeader } from './SectionOrangeHeader';

/** 오늘 암송·복습 훈련 구절 섹션 머리말 라벨 */
export function TodayPracticeVerseBadge() {
  const { t } = useTranslation();
  const label = t('home.todayTrainingVersesBadge');
  return (
    <SectionOrangeHeader title={label} accessibilityLabel={label} />
  );
}
