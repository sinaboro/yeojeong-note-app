import { useState } from 'react';
import {
  Check,
  Compass,
  Copy,
  ExternalLink,
  MapPin,
  Moon,
  RefreshCw,
  Sun,
  Sunset,
  Wallet,
} from 'lucide-react';
import type {
  BudgetLevel,
  ItineraryResponse,
  TimeOfDay,
  TravelStyle,
} from '../types/itinerary';
import heroTravelJournalImg from '../assets/images/hero_travel_journal_1795586451444.jpg';

interface QuickTemplate {
  title: string;
  subtitle: string;
  city: string;
  days: number;
  styles: TravelStyle[];
  budget: BudgetLevel;
}

interface ItineraryViewProps {
  itinerary: ItineraryResponse | null;
  isLoading: boolean;
  error: string | null;
  activeDay: number | 'all';
  onActiveDayChange: (day: number | 'all') => void;
  onApplyTemplate: (template: QuickTemplate) => void;
  onRegenerate: () => void;
}

const HERO_IMAGE_PATH = heroTravelJournalImg;

const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    title: '제주 3일',
    subtitle: '자연 · 맛집 · 보통 예산',
    city: '제주',
    days: 3,
    styles: ['자연', '맛집'],
    budget: '보통',
  },
  {
    title: '도쿄 4일',
    subtitle: '맛집 · 쇼핑 · 보통 예산',
    city: '도쿄',
    days: 4,
    styles: ['맛집', '쇼핑'],
    budget: '보통',
  },
  {
    title: '파리 3일',
    subtitle: '박물관 · 맛집 · 여유 예산',
    city: '파리',
    days: 3,
    styles: ['박물관', '맛집'],
    budget: '여유',
  },
];

function getTimeIcon(timeOfDay: TimeOfDay) {
  switch (timeOfDay) {
    case '오전':
      return Sun;
    case '오후':
      return Sunset;
    case '저녁':
      return Moon;
  }
}

function formatItineraryText(itinerary: ItineraryResponse): string {
  const header = [
    `[${itinerary.city} ${itinerary.daysCount}일 여행 일정]`,
    `스타일: ${itinerary.styles.join(', ')} · 예산: ${itinerary.budget} · 총 예상 경비: ${itinerary.totalEstimatedCost}`,
    itinerary.summary,
    '',
  ];

  const body = itinerary.days.flatMap((day) => [
    `■ ${day.dayNumber}일차: ${day.theme} (예상 ${day.dailyBudget})`,
    ...day.slots.map(
      (slot) =>
        `  - [${slot.timeOfDay}] ${slot.placeName} (${slot.category}) | ${slot.estimatedCost}\n    ${slot.description} (팁: ${slot.tip})`
    ),
    '',
  ]);

  return [...header, ...body].join('\n');
}

export default function ItineraryView({
  itinerary,
  isLoading,
  error,
  activeDay,
  onActiveDayChange,
  onApplyTemplate,
  onRegenerate,
}: ItineraryViewProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!itinerary) return;
    try {
      await navigator.clipboard.writeText(formatItineraryText(itinerary));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (isLoading) {
    return (
      <section
        aria-live="polite"
        aria-label="일정 생성 중"
        className="space-y-6"
      >
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-4 w-full max-w-md bg-slate-100 rounded-lg animate-pulse" />
            </div>
            <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse" />
          </div>
          <p className="text-sm text-teal-800 font-medium">
            도시 동선과 시간대별 장소, 예상 비용을 정리하고 있습니다...
          </p>
        </div>

        <div className="space-y-4">
          <div className="h-5 w-40 bg-slate-200 rounded-md animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['오전', '오후', '저녁'].map((slot) => (
              <div
                key={slot}
                className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4"
              >
                <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
                <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3.5 w-full bg-slate-100 rounded animate-pulse" />
                  <div className="h-3.5 w-5/6 bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between">
                  <div className="h-3.5 w-16 bg-slate-100 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        role="alert"
        className="bg-white border border-rose-200 rounded-2xl p-6 sm:p-8 space-y-4"
      >
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-slate-900">
            일정을 불러오지 못했습니다
          </h3>
          <p className="text-sm text-rose-700 leading-relaxed">{error}</p>
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          className="min-h-[44px] px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          <span>다시 시도하기</span>
        </button>
      </section>
    );
  }

  if (!itinerary) {
    return (
      <section id="recommended-templates" className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="relative aspect-[16/9] max-h-[300px] w-full bg-slate-100 overflow-hidden">
            {!imageFailed ? (
              <img
                src={HERO_IMAGE_PATH}
                alt="창가 테이블 위에 놓인 여행 노트와 지도"
                referrerPolicy="no-referrer"
                onError={() => setImageFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-200 via-teal-50 to-slate-100 flex flex-col items-center justify-center gap-2 text-slate-600 p-6">
                <Compass className="w-8 h-8 text-teal-700" aria-hidden="true" />
                <span className="text-sm font-medium">
                  나만의 맞춤형 여행 일정표
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 text-white">
              <p className="text-xs font-medium text-teal-200 mb-1">
                오전 · 오후 · 저녁 하루 동선 설계
              </p>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                어디로 떠나고 싶으신가요?
              </h2>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              왼쪽에서 여행 도시와 기간, 취향과 예산을 고르고{' '}
              <strong className="font-semibold text-slate-900">
                일정 만들기
              </strong>
              를 누르면 하루별 장소를 오전·오후·저녁 카드로 정리해 드립니다.
            </p>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">
                  바로 시작하기
                </h3>
                <span className="text-xs text-slate-500">
                  누르면 바로 일정을 생성합니다
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {QUICK_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.title}
                    type="button"
                    onClick={() => onApplyTemplate(tpl)}
                    className="min-h-[64px] p-3.5 text-left bg-slate-50 hover:bg-teal-50/60 border border-slate-200 hover:border-teal-700/40 rounded-xl transition-colors cursor-pointer"
                  >
                    <span className="block text-sm font-bold text-slate-900">
                      {tpl.title}
                    </span>
                    <span className="block text-xs text-slate-500 mt-1">
                      {tpl.subtitle}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const visibleDays =
    activeDay === 'all'
      ? itinerary.days
      : itinerary.days.filter((d) => d.dayNumber === activeDay);

  return (
    <section id="itinerary-results" className="space-y-6">
      {/* Summary Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-500">
              <span className="tabular-nums">{itinerary.daysCount}일 일정</span>
              <span aria-hidden="true">·</span>
              <span>{itinerary.styles.join(', ')}</span>
              <span aria-hidden="true">·</span>
              <span>예산 {itinerary.budget}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {itinerary.city} 여행 일정
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {itinerary.summary}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="min-h-[44px] px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-teal-700" aria-hidden="true" />
                  <span>복사됨</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" aria-hidden="true" />
                  <span>일정 복사</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onRegenerate}
              className="min-h-[44px] px-3.5 py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-xl inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>다시 짜기</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-slate-500 inline-flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-slate-400" aria-hidden="true" />
            <span>1인 총 예상 경비 (교통·식사·입장료 기준)</span>
          </span>
          <span className="font-bold text-slate-900 tabular-nums">
            {itinerary.totalEstimatedCost}
          </span>
        </div>
      </div>

      {/* Day Filter Tabs */}
      <div
        role="tablist"
        aria-label="일차별 보기"
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeDay === 'all'}
          onClick={() => onActiveDayChange('all')}
          className={`min-h-[44px] px-4 py-2 text-sm font-semibold rounded-xl border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeDay === 'all'
              ? 'bg-teal-700 border-teal-700 text-white'
              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          전체 일정
        </button>
        {itinerary.days.map((day) => {
          const isSelected = activeDay === day.dayNumber;
          return (
            <button
              key={day.dayNumber}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onActiveDayChange(day.dayNumber)}
              className={`min-h-[44px] px-4 py-2 text-sm font-semibold rounded-xl border transition-colors tabular-nums whitespace-nowrap shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-teal-700 border-teal-700 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {day.dayNumber}일차
            </button>
          );
        })}
      </div>

      {/* Day-by-Day Sections */}
      <div className="space-y-8">
        {visibleDays.map((day) => (
          <div key={day.dayNumber} className="space-y-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
              <div className="flex items-baseline gap-2.5 min-w-0">
                <h3 className="text-lg font-bold text-slate-900 tabular-nums whitespace-nowrap">
                  {day.dayNumber}일차
                </h3>
                <span className="text-slate-300" aria-hidden="true">
                  /
                </span>
                <p className="text-sm sm:text-base font-semibold text-slate-700 truncate">
                  {day.theme}
                </p>
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-500 tabular-nums whitespace-nowrap">
                하루 예상 {day.dailyBudget}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {day.slots.map((slot) => {
                const TimeIcon = getTimeIcon(slot.timeOfDay);
                return (
                  <article
                    key={`${day.dayNumber}-${slot.timeOfDay}`}
                    className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-800">
                        <TimeIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>{slot.timeOfDay}</span>
                        <span className="text-slate-300 font-normal" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-slate-500 font-medium">
                          {slot.category}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 leading-snug">
                        {slot.placeName}
                      </h4>

                      <p className="text-sm text-slate-600 leading-relaxed">
                        {slot.description}
                      </p>

                      {slot.tip && (
                        <p className="text-xs text-slate-500 leading-relaxed pt-1">
                          참고 · {slot.tip}
                        </p>
                      )}
                    </div>

                    <div className="pt-3.5 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                        <span className="text-slate-500">예상 비용</span>
                        <span className="font-semibold text-slate-900 tabular-nums">
                          {slot.estimatedCost}
                        </span>
                      </div>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${itinerary.city} ${slot.placeName}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full min-h-[44px] px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-teal-800 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-700/40 rounded-xl inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>지도에서 보기</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Notice */}
      <p className="text-xs sm:text-sm text-slate-500 text-center bg-white border border-slate-200 rounded-2xl px-4 py-3.5 leading-relaxed">
        AI 가 만든 일정이라 영업시간·가격은 다를 수 있어요. 떠나기 전에 꼭 확인하세요.
      </p>
    </section>
  );
}
