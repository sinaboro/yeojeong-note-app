import type { FormEvent } from 'react';
import {
  Landmark,
  Loader2,
  MapPin,
  ShoppingBag,
  Trees,
  Utensils,
} from 'lucide-react';
import type { BudgetLevel, TravelStyle } from '../types/itinerary';

interface PlannerFormProps {
  city: string;
  onCityChange: (city: string) => void;
  days: number;
  onDaysChange: (days: number) => void;
  styles: TravelStyle[];
  onToggleStyle: (style: TravelStyle) => void;
  budget: BudgetLevel;
  onBudgetChange: (budget: BudgetLevel) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
  validationError: string | null;
}

const POPULAR_CITIES = ['서울', '부산', '제주', '도쿄', '오사카', '파리', '방콕'];
const DAY_OPTIONS = [1, 2, 3, 4, 5];

const STYLE_OPTIONS: Array<{
  value: TravelStyle;
  label: string;
  desc: string;
  icon: typeof Utensils;
}> = [
  { value: '맛집', label: '맛집', desc: '현지 음식·카페', icon: Utensils },
  { value: '자연', label: '자연', desc: '공원·산책·풍경', icon: Trees },
  { value: '박물관', label: '박물관', desc: '전시·역사·미술', icon: Landmark },
  { value: '쇼핑', label: '쇼핑', desc: '거리·소품·시장', icon: ShoppingBag },
];

const BUDGET_OPTIONS: Array<{
  value: BudgetLevel;
  label: string;
  hint: string;
}> = [
  { value: '아끼기', label: '아끼기', hint: '가성비·무료 명소' },
  { value: '보통', label: '보통', hint: '균형 잡힌 경비' },
  { value: '여유', label: '여유', hint: '미식·프리미엄' },
];

export default function PlannerForm({
  city,
  onCityChange,
  days,
  onDaysChange,
  styles,
  onToggleStyle,
  budget,
  onBudgetChange,
  onSubmit,
  isLoading,
  validationError,
}: PlannerFormProps) {
  return (
    <form
      id="planner-form"
      onSubmit={onSubmit}
      className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-6"
    >
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          여행 조건 입력
        </h2>
        <p className="text-sm text-slate-500">
          도시와 취향을 고르면 하루별 맞춤 일정을 구성합니다.
        </p>
      </div>

      {/* 1. 여행 도시 */}
      <div className="space-y-2.5">
        <label
          htmlFor="city-input"
          className="block text-sm font-semibold text-slate-800"
        >
          여행 도시
        </label>
        <div className="relative">
          <MapPin
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="city-input"
            type="text"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="예: 도쿄, 제주, 파리, 경주"
            maxLength={60}
            className="w-full min-h-[46px] pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15 transition-colors"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {POPULAR_CITIES.map((preset) => {
            const isActive = city.trim() === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => onCityChange(preset)}
                className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-teal-700 border-teal-700 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {preset}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 여행 기간 (1~5일) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800">
            여행 기간
          </span>
          <span className="text-xs font-medium text-teal-700 tabular-nums">
            {days}일 일정
          </span>
        </div>
        <div
          role="radiogroup"
          aria-label="여행 기간 선택"
          className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-xl"
        >
          {DAY_OPTIONS.map((d) => {
            const selected = days === d;
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onDaysChange(d)}
                className={`min-h-[44px] text-sm font-semibold rounded-lg transition-all tabular-nums whitespace-nowrap cursor-pointer ${
                  selected
                    ? 'bg-white text-teal-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d}일
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 여행 스타일 (복수 선택) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800">
            여행 스타일
          </span>
          <span className="text-xs text-slate-500 tabular-nums">
            여러 개 선택 가능 · {styles.length}개 선택됨
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {STYLE_OPTIONS.map((item) => {
            const Icon = item.icon;
            const selected = styles.includes(item.value);
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onToggleStyle(item.value)}
                className={`min-h-[56px] px-3.5 py-2.5 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                  selected
                    ? 'bg-teal-50/70 border-teal-700 text-teal-950'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    selected
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight">
                    {item.label}
                  </span>
                  <span className="block text-xs text-slate-500 mt-0.5 truncate">
                    {item.desc}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. 예산 */}
      <div className="space-y-2.5">
        <span className="block text-sm font-semibold text-slate-800">
          예산 수준
        </span>
        <div
          role="radiogroup"
          aria-label="예산 수준 선택"
          className="grid grid-cols-3 gap-2"
        >
          {BUDGET_OPTIONS.map((option) => {
            const selected = budget === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onBudgetChange(option.value)}
                className={`min-h-[54px] px-2.5 py-2 rounded-xl border text-center transition-all cursor-pointer ${
                  selected
                    ? 'bg-teal-50/70 border-teal-700 text-teal-950'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="block text-sm font-semibold">
                  {option.label}
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5 whitespace-nowrap truncate">
                  {option.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {validationError && (
        <p
          role="alert"
          className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5"
        >
          {validationError}
        </p>
      )}

      {/* Submit CTA */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full min-h-[48px] px-5 py-3 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-700/60 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer disabled:cursor-not-allowed active:scale-[0.99]"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            <span>일정을 만드는 중...</span>
          </>
        ) : (
          <span>일정 만들기</span>
        )}
      </button>
    </form>
  );
}
