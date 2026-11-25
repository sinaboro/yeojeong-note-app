import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type {
  BudgetLevel,
  ItineraryRequest,
  ItineraryResponse,
  TimeOfDay,
} from '../types/itinerary';

async function generateWithRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status?: unknown }).status)
          : 0;
      const isClientError = status >= 400 && status < 500 && status !== 429;
      if (isClientError || attempt === maxRetries) {
        throw err;
      }
      const delayMs = 600 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

function getBudgetGuide(budget: BudgetLevel): string {
  switch (budget) {
    case '아끼기':
      return '대중교통, 무료 공원·전망대, 현지인 가성비 맛집·길거리 음식 위주로 1일 식비·입장료 지출을 최소화하세요.';
    case '보통':
      return '합리적인 가격의 인기 맛집, 주요 유료 명소·박물관, 적당한 카페와 쇼핑을 균형 있게 배분하세요.';
    case '여유':
      return '예약제 미식 레스토랑, 프라이빗·프리미엄 체험, 랜드마크 전망대, 분위기 있는 바·쇼핑 스팟 위주로 구성하세요.';
  }
}

export async function generateItineraryWithGemini(
  apiKey: string,
  params: ItineraryRequest
): Promise<ItineraryResponse> {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new Error('화면 상단에 Gemini API 키를 입력해 주세요.');
  }

  const city = params.city.trim();
  const days = Math.round(params.days);
  const { styles, budget } = params;

  const ai = new GoogleGenAI({
    apiKey: trimmedKey,
  });

  const prompt = [
    `여행지: ${city}`,
    `여행 기간: ${days}일`,
    `선호 스타일: ${styles.join(', ')}`,
    `예산 수준: ${budget} (${getBudgetGuide(budget)})`,
    '',
    '위 조건에 맞는 현실적이고 동선이 효율적인 여행 일정을 한국어로 작성해 주세요.',
    '규칙:',
    `1. 정확히 ${days}일치(1일차~${days}일차) 일정을 생성하세요.`,
    '2. 하루마다 반드시 "오전", "오후", "저녁" 순서로 3개 장소를 추천하세요.',
    '3. 선택한 여행 스타일(맛집, 자연, 박물관, 쇼핑)이 전체 일정에 고르게 반영되도록 하세요.',
    '4. placeName에는 실제 존재하는 대표적인 장소나 상권·식당명을 쓰고, 지역 이동이 무리 없는 동선으로 묶으세요.',
    '5. description은 1~2문장(45~90자)으로 핵심 매력과 추천 이유를 간결하고 자연스러운 한국어로 쓰세요.',
    '6. estimatedCost는 한국 원화(예: "약 18,000원", "무료", "입장료 약 22,000원") 기준으로 1인 예상 비용을 표기하세요. 해외 도시면 필요시 괄호로 현지 통화를 간략히 덧붙여도 좋습니다.',
    '7. tip은 추천 메뉴, 예약 팁, 방문하기 좋은 시간 등 35자 이내의 실용적인 한 줄 팁을 작성하세요.',
    '8. 모든 텍스트는 반드시 자연스러운 한국어로 작성하세요.',
  ].join('\n');

  try {
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            '당신은 동선과 예산을 꼼꼼하게 설계하는 베테랑 한국인 여행 플래너입니다. 과장 없이 실용적이고 검증된 실제 명소와 맛집 중심으로 일정을 구성하며, 모든 응답은 자연스러운 한국어 JSON으로만 출력합니다.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              city: {
                type: Type.STRING,
                description: '표준 한국어 도시명 (예: 도쿄, 제주, 파리)',
              },
              summary: {
                type: Type.STRING,
                description: '전체 여행 컨셉과 동선을 요약한 1~2문장 한국어 소개',
              },
              totalEstimatedCost: {
                type: Type.STRING,
                description: '1인 기준 전체 일정 예상 경비 (예: 약 38만 원)',
              },
              days: {
                type: Type.ARRAY,
                description: '하루별 일정 목록',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dayNumber: {
                      type: Type.INTEGER,
                      description: '일차 번호 (1부터 시작)',
                    },
                    theme: {
                      type: Type.STRING,
                      description: '해당 일차의 핵심 테마 (예: 구도심 미식과 야경 산책)',
                    },
                    dailyBudget: {
                      type: Type.STRING,
                      description: '해당 일차 1인 예상 경비 (예: 약 11만 원)',
                    },
                    slots: {
                      type: Type.ARRAY,
                      description: '오전, 오후, 저녁 순서의 3개 장소 카드',
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          timeOfDay: {
                            type: Type.STRING,
                            description: '시간대: 오전, 오후, 저녁 중 하나',
                          },
                          placeName: {
                            type: Type.STRING,
                            description: '방문할 실제 장소 또는 맛집 이름',
                          },
                          category: {
                            type: Type.STRING,
                            description: '장소 성격 (예: 맛집, 자연, 박물관, 쇼핑, 명소)',
                          },
                          description: {
                            type: Type.STRING,
                            description: '장소에 대한 짧은 한국어 설명 (1~2문장)',
                          },
                          estimatedCost: {
                            type: Type.STRING,
                            description: '1인 예상 비용 (예: 약 15,000원 또는 무료)',
                          },
                          tip: {
                            type: Type.STRING,
                            description: '짧은 실용 팁 한 줄',
                          },
                        },
                        required: [
                          'timeOfDay',
                          'placeName',
                          'category',
                          'description',
                          'estimatedCost',
                          'tip',
                        ],
                      },
                    },
                  },
                  required: ['dayNumber', 'theme', 'dailyBudget', 'slots'],
                },
              },
            },
            required: ['city', 'summary', 'totalEstimatedCost', 'days'],
          },
        },
      })
    );

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      throw new Error('일정 데이터를 생성하지 못했습니다. 다시 시도해 주세요.');
    }

    const parsed = JSON.parse(rawText) as {
      city?: string;
      summary?: string;
      totalEstimatedCost?: string;
      days?: Array<{
        dayNumber?: number;
        theme?: string;
        dailyBudget?: string;
        slots?: Array<{
          timeOfDay?: string;
          placeName?: string;
          category?: string;
          description?: string;
          estimatedCost?: string;
          tip?: string;
        }>;
      }>;
    };

    const expectedTimes: readonly TimeOfDay[] = ['오전', '오후', '저녁'];
    const normalizedDays = (parsed.days ?? []).slice(0, days).map((day, index) => {
      const slots = expectedTimes.map((label, slotIdx) => {
        const found =
          day.slots?.find((s) => s.timeOfDay === label) ?? day.slots?.[slotIdx];
        return {
          timeOfDay: label,
          placeName: found?.placeName?.trim() || `${city} 추천 코스`,
          category: found?.category?.trim() || styles[0],
          description:
            found?.description?.trim() ||
            '현지 분위기를 느끼며 여유롭게 둘러보기 좋은 장소입니다.',
          estimatedCost: found?.estimatedCost?.trim() || '예산에 따라 상이',
          tip: found?.tip?.trim() || '방문 전 운영 시간을 확인해 보세요.',
        };
      });

      return {
        dayNumber: typeof day.dayNumber === 'number' ? day.dayNumber : index + 1,
        theme: day.theme?.trim() || `${index + 1}일차 핵심 코스`,
        dailyBudget: day.dailyBudget?.trim() || '변동',
        slots,
      };
    });

    return {
      city: parsed.city?.trim() || city,
      daysCount: days,
      styles,
      budget,
      summary:
        parsed.summary?.trim() ||
        `${city}의 매력을 ${days}일 동안 알차게 둘러보는 맞춤 일정입니다.`,
      totalEstimatedCost:
        parsed.totalEstimatedCost?.trim() || '일정별 상세 비용 참고',
      days: normalizedDays,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes('API_KEY_INVALID') ||
      message.includes('PERMISSION_DENIED') ||
      message.includes('API key not valid') ||
      message.includes('403') ||
      message.includes('400')
    ) {
      throw new Error(
        'Gemini API 키가 올바르지 않거나 권한이 없습니다. 상단 입력 칸의 API 키를 다시 확인해 주세요.'
      );
    }
    if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
      throw new Error(
        '요청 한도를 초과했거나 잠시 혼잡합니다. 잠시 후 다시 시도해 주세요.'
      );
    }
    if (error instanceof Error && error.message.includes('일정 데이터를')) {
      throw error;
    }
    throw new Error(
      '여행 일정을 만드는 중 오류가 발생했습니다. API 키와 네트워크 상태를 확인한 뒤 다시 시도해 주세요.'
    );
  }
}
