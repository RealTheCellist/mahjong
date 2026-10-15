import { NANIKIRU_CHAPTERS, CHAPTER_LABELS } from './fixedProblems';
import { getTheorySlides } from './theorySlides';

export interface LabSection {
  chapterId: string;
  no: string;
  title: string;
  description: string;
}

export interface LabSub {
  id: string;
  index: number;
  tag: string;
  title: string;
  body: string;
}

const SECTION_DESCRIPTION: Record<string, string> = {
  '1-1': '고립패를 가려내는 가장 기초적인 정리 기술을 배웁니다.',
  '1-2': '블록이 넘칠 때 어떤 타츠를 남길지 비교하는 법을 배웁니다.',
  '2-1': '버림 선택의 기준이 되는 유효패 계산을 배웁니다.',
};

export const LAB_SECTIONS: LabSection[] = NANIKIRU_CHAPTERS.map((chapterId, i) => ({
  chapterId,
  no: String(i + 1).padStart(2, '0'),
  title: CHAPTER_LABELS[chapterId] ?? chapterId,
  description: SECTION_DESCRIPTION[chapterId] ?? '',
}));

export function getLabSubs(chapterId: string): LabSub[] {
  return getTheorySlides(chapterId).map((slide, i) => ({
    id: `${chapterId}-${i}`,
    index: i,
    tag: CHAPTER_LABELS[chapterId] ?? chapterId,
    title: slide.title,
    body: slide.body,
  }));
}
