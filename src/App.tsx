import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, Trash2 } from 'lucide-react';
import ItineraryView from './components/ItineraryView';
import PlannerForm from './components/PlannerForm';
import { generateItineraryWithGemini } from './services/geminiItinerary';
import type {
  BudgetLevel,
  ItineraryResponse,
  TravelStyle,
} from './types/itinerary';

const STORAGE_KEY_VALUE = 'yeojeongnote_gemini_api_key';
const STORAGE_KEY_REMEMBER = 'yeojeongnote_remember_api_key';

function getInitialRememberState(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY_REMEMBER) === 'true';
  } catch {
    return false;
  }
}

function getInitialApiKey(): string {
  try {
    if (window.localStorage.getItem(STORAGE_KEY_REMEMBER) === 'true') {
      return window.localStorage.getItem(STORAGE_KEY_VALUE) ?? '';
    }
    return '';
  } catch {
    return '';
  }
}

export default function App() {
  const [rememberApiKey, setRememberApiKey] = useState<boolean>(getInitialRememberState);
  const [apiKey, setApiKey] = useState<string>(getInitialApiKey);
  const [showApiKey, setShowApiKey] = useState(false);

  const [city, setCity] = useState('서울');
  const [days, setDays] = useState(2);
  const [styles, setStyles] = useState<TravelStyle[]>(['맛집', '자연']);
  const [budget, setBudget] = useState<BudgetLevel>('보통');

  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);
  const [activeDay, setActiveDay] = useState<number | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement | null>(null);
  const apiKeyInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      if (rememberApiKey) {
        window.localStorage.setItem(STORAGE_KEY_REMEMBER, 'true');
        window.localStorage.setItem(STORAGE_KEY_VALUE, apiKey);
      } else {
        window.localStorage.removeItem(STORAGE_KEY_VALUE);
        window.localStorage.setItem(STORAGE_KEY_REMEMBER, 'false');
      }
    } catch {
      // Ignore storage access errors in restricted browsing modes
    }
  }, [apiKey, rememberApiKey]);

  const handleToggleStyle = (style: TravelStyle) => {
    setValidationError(null);
    setStyles((prev) =>
      prev.includes(style)
        ? prev.filter((item) => item !== style)
        : [...prev, style]
    );
  };

  const generateItinerary = async (params: {
    city: string;
    days: number;
    styles: TravelStyle[];
    budget: BudgetLevel;
  }) => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setValidationError('화면 상단의 Gemini API 키를 먼저 입력해 주세요.');
      apiKeyInputRef.current?.focus();
      return;
    }

    const trimmedCity = params.city.trim();
    if (!trimmedCity) {
      setValidationError('여행할 도시 이름을 입력해 주세요.');
      return;
    }
    if (params.styles.length === 0) {
      setValidationError('여행 스타일을 최소 1개 이상 선택해 주세요.');
      return;
    }

    setValidationError(null);
    setError(null);
    setIsLoading(true);
    setActiveDay('all');

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }

    try {
      const data = await generateItineraryWithGemini(trimmedKey, {
        city: trimmedCity,
        days: params.days,
        styles: params.styles,
        budget: params.budget,
      });
      setItinerary(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void generateItinerary({ city, days, styles, budget });
  };

  const handleApplyTemplate = (tpl: {
    city: string;
    days: number;
    styles: TravelStyle[];
    budget: BudgetLevel;
  }) => {
    setCity(tpl.city);
    setDays(tpl.days);
    setStyles(tpl.styles);
    setBudget(tpl.budget);
    void generateItinerary(tpl);
  };

  const handleReset = () => {
    setItinerary(null);
    setError(null);
    setValidationError(null);
    setActiveDay('all');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleClearApiKey = () => {
    setApiKey('');
    setRememberApiKey(false);
    try {
      window.localStorage.removeItem(STORAGE_KEY_VALUE);
      window.localStorage.removeItem(STORAGE_KEY_REMEMBER);
    } catch {
      // Ignore storage access errors
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Compact 3-zone sticky header (56px height, <= 15% mobile cap) */}
      <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              handleReset();
            }}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            여정노트
          </a>

          <nav
            aria-label="주요 메뉴"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <a
              href="#planner-form"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              여행 조건
            </a>
            <a
              href="#recommended-templates"
              onClick={(e) => {
                if (itinerary) {
                  e.preventDefault();
                  handleReset();
                }
              }}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              추천 코스
            </a>
            <button
              type="button"
              onClick={() =>
                resultsRef.current?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              하루별 일정
            </button>
          </nav>

          <button
            type="button"
            onClick={handleReset}
            className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            새 일정
          </button>
        </div>
      </header>

      {/* Main Responsive Workspace */}
      <main id="top" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Gemini API Key Input Bar (top of page) */}
        <section
          aria-label="Gemini API 키 설정"
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5"
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-3.5 lg:gap-5">
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4" aria-hidden="true" />
              </span>
              <label
                htmlFor="gemini-api-key-input"
                className="text-sm font-bold text-slate-900 whitespace-nowrap"
              >
                Gemini API 키
              </label>
            </div>

            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
              <div className="relative flex-1 min-w-0">
                <input
                  ref={apiKeyInputRef}
                  id="gemini-api-key-input"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder="본인의 Gemini API 키를 입력하세요"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full min-h-[44px] pl-3.5 pr-20 py-2 text-sm font-mono text-slate-900 placeholder:font-sans placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15 transition-colors"
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setShowApiKey((prev) => !prev)}
                    aria-label={showApiKey ? 'API 키 숨기기' : 'API 키 보기'}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    {showApiKey ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                  {apiKey && (
                    <button
                      type="button"
                      onClick={handleClearApiKey}
                      aria-label="API 키 지우기"
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              <label className="min-h-[44px] inline-flex items-center gap-2 px-1 text-sm font-medium text-slate-700 cursor-pointer select-none whitespace-nowrap shrink-0">
                <input
                  type="checkbox"
                  checked={rememberApiKey}
                  onChange={(e) => setRememberApiKey(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-teal-700 accent-teal-700 cursor-pointer"
                />
                <span>이 브라우저에 기억</span>
              </label>
            </div>
          </div>

          <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
            입력한 키는 별도 서버로 전송되지 않고 브라우저에서 Gemini API를 직접 호출할 때만 사용됩니다. 공용 PC에서는 &lsquo;이 브라우저에 기억&rsquo;을 꺼 주세요.
          </p>
        </section>

        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            맞춤 여행 일정 플래너
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            도시와 기간, 스타일, 예산을 선택하면 오전·오후·저녁 하루별 코스를 제안합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-4 lg:sticky lg:top-20">
            <PlannerForm
              city={city}
              onCityChange={(val) => {
                setCity(val);
                setValidationError(null);
              }}
              days={days}
              onDaysChange={setDays}
              styles={styles}
              onToggleStyle={handleToggleStyle}
              budget={budget}
              onBudgetChange={setBudget}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              validationError={validationError}
            />
          </div>

          <div ref={resultsRef} className="lg:col-span-8 min-w-0">
            <ItineraryView
              itinerary={itinerary}
              isLoading={isLoading}
              error={error}
              activeDay={activeDay}
              onActiveDayChange={setActiveDay}
              onApplyTemplate={handleApplyTemplate}
              onRegenerate={() =>
                void generateItinerary({ city, days, styles, budget })
              }
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>여정노트 · 하루별 여행 일정 도우미</span>
          <span>예상 비용은 현지 물가 및 방문 시기에 따라 달라질 수 있습니다.</span>
        </div>
      </footer>
    </div>
  );
}
