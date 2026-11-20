import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  getWeeklyTransits,
  type WeeklyTransit,
  type WeeklyTransitsResponse,
} from '@/features/astrology/api/weekly-transits';
import {
  resolveCurrentBirthProfile,
  type CurrentBirthInput,
} from '@/features/astrology/birthInputStorage';
import { usePalette } from '@/localization';

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

type Range = 7 | 30;
type ViewState =
  | 'loading'
  | 'profile-missing'
  | 'time-missing'
  | 'error'
  | 'ready';

function transitDay(item: WeeklyTransit) {
  if (!item.exactTime) return null;

  const match = item.exactTime.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]) - 1,
    day: Number(match[3]),
  };
}

function rangeDay(value: string | null | undefined) {
  if (!value) return null;

  const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);

  if (!match) return null;

  return {
    year: Number(match[3]),
    month: Number(match[1]) - 1,
    day: Number(match[2]),
  };
}

function dayKey(value: { year: number; month: number; day: number }) {
  return value.year * 10000 + (value.month + 1) * 100 + value.day;
}

const PLANET_LABELS: Record<string, string> = {
  Sun: 'Güneş',
  Moon: 'Ay',
  Mercury: 'Merkür',
  Venus: 'Venüs',
  Mars: 'Mars',
  Jupiter: 'Jüpiter',
  Saturn: 'Satürn',
  Uranus: 'Uranüs',
  Neptune: 'Neptün',
  Pluto: 'Plüton',
};

const ASPECT_LABELS: Record<string, string> = {
  conjunction: 'Kavuşumu',
  sextile: 'Sekstili',
  square: 'Karesi',
  trine: 'Üçgeni',
  opposition: 'Karşıtlığı',
};

function formatTransitTitle(item: WeeklyTransit) {
  const transit =
    PLANET_LABELS[item.transitPlanet] ?? item.transitPlanet;

  const natal =
    PLANET_LABELS[item.natalPlanet] ?? item.natalPlanet;

  const aspect =
    ASPECT_LABELS[item.aspectType.toLowerCase()] ??
    item.aspectType;

  return `${transit} – ${natal} ${aspect}`;
}

export default function AstroCalendarScreen() {
  const palette = usePalette();
  const { loading: authLoading, session } = useAuth();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const [range, setRange] = useState<Range>(7);
  const [selectedDay, setSelectedDay] = useState(today);
  const [state, setState] = useState<ViewState>('loading');
  const [profile, setProfile] = useState<CurrentBirthInput | null>(null);
  const [result, setResult] = useState<WeeklyTransitsResponse | null>(null);

  const load = useCallback(async () => {
    if (authLoading) return;

    setState('loading');

    try {
      const nextProfile = await resolveCurrentBirthProfile(
        session?.access_token,
      );

      setProfile(nextProfile);

      if (!nextProfile?.birth_date || !nextProfile.birth_place) {
        setState('profile-missing');
        return;
      }

      if (nextProfile.birth_time_unknown || !nextProfile.birth_time) {
        setState('time-missing');
        return;
      }

      const response = await getWeeklyTransits(nextProfile);

      setResult(response);
      setState('ready');
    } catch {
      setState('error');
    }
  }, [authLoading, session?.access_token]);

  useEffect(() => {
    void load();
  }, [load]);

  const calendar = useMemo(() => {
    const first = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0).getDate();
    const mondayIndex = (first.getDay() + 6) % 7;

    return [
      ...Array.from({ length: mondayIndex }, () => null),
      ...Array.from({ length: lastDay }, (_, index) => index + 1),
    ];
  }, [month, year]);

  const transitsByDay = useMemo(() => {
    const map = new Map<number, WeeklyTransit[]>();
    const start = rangeDay(result?.startDate);
    const end = rangeDay(result?.endDate);
    const startKey = start ? dayKey(start) : null;
    const endKey = end ? dayKey(end) : null;

    for (const item of result?.transits ?? []) {
      const date = transitDay(item);

      if (!date) continue;

      const exactKey = dayKey(date);

      if (startKey !== null && exactKey < startKey) continue;
      if (endKey !== null && exactKey > endKey) continue;
      if (date.year !== year || date.month !== month) continue;

      const list = map.get(date.day) ?? [];
      list.push(item);
      map.set(date.day, list);
    }

    return map;
  }, [
    month,
    result?.endDate,
    result?.startDate,
    result?.transits,
    year,
  ]);

  const beautyByDay = useMemo(() => {
    const map = new Map<number, string[]>();

    for (const item of result?.beautyTiming ?? []) {
      const [itemYear, itemMonth, itemDay] = item.date
        .split('-')
        .map(Number);

      if (
        itemYear !== year ||
        itemMonth !== month + 1 ||
        !itemDay ||
        !item.labels?.length
      ) {
        continue;
      }

      map.set(itemDay, item.labels);
    }

    return map;
  }, [month, result?.beautyTiming, year]);

  const selectedTransits = transitsByDay.get(selectedDay) ?? [];
  const selectedBeautyLabels = beautyByDay.get(selectedDay) ?? [];

  const selectedCategories = [
    ...new Set(
      selectedTransits
        .map((item) => item.category)
        .filter(Boolean),
    ),
  ];

  const displayCategories = selectedCategories.filter(
    (category) =>
      category !== 'İç Dünya' &&
      category !== 'Kişisel' &&
      !(selectedBeautyLabels.length > 0 && category === 'Bakım'),
  );

  return (
    <Screen>
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={[
            styles.backButton,
            { backgroundColor: palette.sapphireSoft },
          ]}>
          <Ionicons
            name="chevron-back"
            size={23}
            color={palette.sapphire}
          />
        </Pressable>

        <View style={styles.heading}>
          <Text style={styles.eyebrow}>KİŞİSEL ASTROLOJİ TAKVİMİN</Text>
          <Text style={[styles.title, { color: palette.navy }]}>
            Yaklaşan Önemli Günler
          </Text>
        </View>
      </View>

      <Text style={[styles.description, { color: palette.muted }]}>
        Önündeki günlerde aşk, para, kariyer, iletişim, bakım,
        sosyalleşme ve seyahat için öne çıkan tarihleri gör.
      </Text>

      <View
        style={[
          styles.rangeCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}>
        <RangeButton
          label="7 Gün"
          active={range === 7}
          onPress={() => setRange(7)}
        />
        <RangeButton
          label="30 Gün"
          active={range === 30}
          onPress={() => setRange(30)}
        />
      </View>

      {state === 'loading' ? (
        <StateCard>
          <ActivityIndicator color={colors.sapphire} size="large" />
          <Text style={[styles.stateTitle, { color: palette.navy }]}>
            Yaklaşan önemli günlerin hazırlanıyor…
          </Text>
        </StateCard>
      ) : null}

      {state === 'profile-missing' ? (
        <StateCard>
          <Text style={[styles.stateTitle, { color: palette.navy }]}>
            Kişisel takvimin için doğum bilgilerini kaydetmen gerekiyor.
          </Text>
        </StateCard>
      ) : null}

      {state === 'time-missing' ? (
        <StateCard>
          <Text style={[styles.stateTitle, { color: palette.navy }]}>
            Kişisel takvimin için doğum saatine ihtiyaç var.
          </Text>
        </StateCard>
      ) : null}

      {state === 'error' ? (
        <StateCard>
          <Text style={[styles.stateTitle, { color: palette.navy }]}>
            Yaklaşan önemli günlerin şu anda hazırlanamadı.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => void load()}
            style={styles.retryButton}>
            <Text style={styles.retryText}>TEKRAR DENE</Text>
          </Pressable>
        </StateCard>
      ) : null}

      {state === 'ready' ? (
        <>
          {range === 30 ? (
            <View
              style={[
                styles.notice,
                { backgroundColor: palette.sapphireSoft },
              ]}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={palette.sapphire}
              />
              <Text style={[styles.noticeText, { color: palette.navy }]}>
                30 günlük kişisel veri bir sonraki aşamada bağlanacak.
              </Text>
            </View>
          ) : null}

          <View
            style={[
              styles.calendarCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}>
            <View style={styles.monthRow}>
              <Text style={[styles.monthTitle, { color: palette.navy }]}>
                {MONTHS[month]} {year}
              </Text>

              <Ionicons
                name="calendar-outline"
                size={22}
                color={palette.sapphire}
              />
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((day) => (
                <Text
                  key={day}
                  style={[styles.weekday, { color: palette.muted }]}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {calendar.map((day, index) => {
                if (!day) {
                  return (
                    <View
                      key={`empty-${index}`}
                      style={styles.dayCell}
                    />
                  );
                }

                const selected = day === selectedDay;
                const isToday = day === today;
                const dayTransits = transitsByDay.get(day) ?? [];
                const dayCategories = [
                  ...new Set(
                    dayTransits
                      .map((item) => item.category)
                      .filter(Boolean),
                  ),
                ];

                return (
                  <Pressable
                    key={day}
                    onPress={() => setSelectedDay(day)}
                    style={[
                      styles.dayCell,
                      selected && styles.selectedDay,
                      isToday && !selected && styles.todayDay,
                    ]}>
                    <Text
                      style={[
                        styles.dayText,
                        { color: palette.navy },
                        selected && styles.selectedDayText,
                      ]}>
                      {day}
                    </Text>

                    {(dayCategories.length || beautyByDay.has(day)) ? (
  <View
    style={[
      styles.singleDayDot,
      selected && styles.singleDayDotSelected,
    ]}
  />
) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>


          <View
            style={[
              styles.detailCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}>
            <Text style={styles.detailEyebrow}>
              {selectedDay}{' '}
              {MONTHS[month].toLocaleUpperCase('tr-TR')}
            </Text>

            <Text style={[styles.detailTitle, { color: palette.navy }]}>
              Bu günün kişisel etkileri
            </Text>

            {(selectedTransits.length || selectedBeautyLabels.length) ? (
  <>
    <View style={styles.selectedCategoryWrap}>
      {selectedBeautyLabels.map((label) => (
        <View
          key={`beauty-${label}`}
          style={[
            styles.selectedCategoryChip,
            { backgroundColor: palette.sapphireSoft },
          ]}>
          <Text
            style={[
              styles.selectedCategoryText,
              { color: palette.sapphire },
            ]}>
            {label}
          </Text>
        </View>
      ))}

      {displayCategories.map((category) => (
        <View
          key={category}
          style={[
            styles.selectedCategoryChip,
            { backgroundColor: palette.sapphireSoft },
          ]}>
          <Text
            style={[
              styles.selectedCategoryText,
              { color: palette.sapphire },
            ]}>
            {category}
          </Text>
        </View>
      ))}
    </View>

    <Text
      style={[
        styles.transitSectionTitle,
        { color: palette.muted },
        !selectedTransits.length && { display: 'none' },
      ]}>
      Astrolojik göstergeler
    </Text>

    <View style={selectedTransits.length ? styles.transitList : { display: 'none' }}>
      {selectedTransits.map((item, index) => (
        <View
          key={`${formatTransitTitle(item)}-${index}`}
          style={[
            styles.transitItem,
            { backgroundColor: palette.sapphireSoft },
          ]}>
          <Text
            style={[
              styles.transitTitle,
              { color: palette.navy },
            ]}>
            {formatTransitTitle(item)}
          </Text>

          {item.exactTime ? (
            <Text
              style={[
                styles.transitTime,
                { color: palette.sapphire },
              ]}>
              En güçlü saat: {item.exactTime.slice(11, 16)}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  </>
) : (
  <Text style={[styles.detailText, { color: palette.muted }]}>
    Bu gün için öne çıkan kesinleşmiş kişisel transit bulunmuyor.
  </Text>
)}

            {profile?.birth_time_source === 'rectification' ? (
              <Text style={[styles.profileNote, { color: palette.muted }]}>
                Rektifikasyonla bulunan doğum saatin kullanıldı.
              </Text>
            ) : null}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function StateCard({ children }: React.PropsWithChildren) {
  const palette = usePalette();

  return (
    <View
      style={[
        styles.stateCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}>
      {children}
    </View>
  );
}

function RangeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.rangeButton,
        active && styles.rangeButtonActive,
      ]}>
      <Text
        style={[
          styles.rangeText,
          active && styles.rangeTextActive,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Legend({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.legendItem}>
      <Ionicons name={icon} size={18} color={colors.sapphire} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },

  backButton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },

  heading: {
    flex: 1,
    gap: 3,
  },

  eyebrow: {
    color: colors.sapphire,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.9,
  },

  title: {
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 31,
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
  },

  rangeCard: {
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 6,
  },

  rangeButton: {
    alignItems: 'center',
    borderRadius: 13,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },

  rangeButtonActive: {
    backgroundColor: colors.sapphire,
  },

  rangeText: {
    color: colors.sapphire,
    fontSize: 15,
    fontWeight: '800',
  },

  rangeTextActive: {
    color: colors.white,
  },

  stateCard: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    padding: 20,
  },

  stateTitle: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 24,
    textAlign: 'center',
  },

  retryButton: {
    alignItems: 'center',
    backgroundColor: colors.sapphire,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 18,
  },

  retryText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
  },

  notice: {
    alignItems: 'center',
    borderRadius: 15,
    flexDirection: 'row',
    gap: 9,
    padding: 12,
  },

  noticeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },

  calendarCard: {
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },

  monthRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  monthTitle: {
    fontSize: 21,
    fontWeight: '900',
  },

  weekRow: {
    flexDirection: 'row',
  },

  weekday: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  dayCell: {
    alignItems: 'center',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    width: '14.2857%',
  },

  selectedDay: {
    backgroundColor: colors.sapphire,
  },

  todayDay: {
    borderColor: colors.sapphire,
    borderWidth: 1,
  },

  dayText: {
    fontSize: 15,
    fontWeight: '800',
  },

  selectedDayText: {
    color: colors.white,
  },

  singleDayDot: {
    backgroundColor: colors.sapphire,
    borderRadius: 4,
    bottom: 4,
    height: 6,
    position: 'absolute',
    width: 6,
  },

  singleDayDotSelected: {
    backgroundColor: colors.white,
  },

  selectedCategoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    paddingTop: 6,
  },

  selectedCategoryChip: {
    borderRadius: 99,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  selectedCategoryText: {
    fontSize: 13,
    fontWeight: '900',
  },

  transitSectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 12,
    textTransform: 'uppercase',
  },

  categoryStack: {
    alignItems: 'center',
    gap: 2,
    marginTop: 3,
    width: '100%',
  },

  categoryBadge: {
    backgroundColor: colors.sapphireSoft,
    borderRadius: 5,
    maxWidth: '94%',
    paddingHorizontal: 3,
    paddingVertical: 1,
  },

  categoryBadgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },

  categoryText: {
    color: colors.sapphire,
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
  },

  categoryTextSelected: {
    color: colors.white,
  },

  moreText: {
    color: colors.sapphire,
    fontSize: 9,
    fontWeight: '900',
  },

  dotRow: {
    bottom: 4,
    flexDirection: 'row',
    gap: 2,
    position: 'absolute',
  },

  dot: {
    backgroundColor: colors.sapphire,
    borderRadius: 3,
    height: 5,
    width: 5,
  },

  goldDot: {
    backgroundColor: colors.gold,
  },

  thirdDot: {
    backgroundColor: '#7C5CBF',
  },

  selectedDot: {
    backgroundColor: colors.white,
  },

  dotLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  dotLegendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  dotLegendDots: {
    flexDirection: 'row',
    gap: 2,
  },

  dotLegendText: {
    fontSize: 12,
    fontWeight: '700',
  },

  detailCard: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 7,
    padding: 17,
  },

  detailEyebrow: {
    color: colors.sapphire,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  detailTitle: {
    fontSize: 19,
    fontWeight: '900',
  },

  detailText: {
    fontSize: 15,
    lineHeight: 22,
  },

  transitList: {
    gap: 8,
    paddingTop: 4,
  },

  transitItem: {
    borderRadius: 14,
    gap: 4,
    padding: 12,
  },

  transitTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 21,
  },

  transitTime: {
    fontSize: 12,
    fontWeight: '800',
  },

  profileNote: {
    fontSize: 12,
    lineHeight: 18,
    paddingTop: 4,
  },

  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  legendItem: {
    alignItems: 'center',
    backgroundColor: colors.sapphireSoft,
    borderRadius: 99,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  legendText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: '800',
  },
});