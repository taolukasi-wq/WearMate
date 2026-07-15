import React, { useEffect, useState } from 'react';
import { UserProfile, Outfit, Item } from '../types';
import { getInitialOutfits } from '../data';
import { useTranslation } from '../i18n';
import { Translations } from '../i18n/types';

interface HomeTabProps {
  user: UserProfile;
  onNavigateToScan: () => void;
  onViewItem: (item: Item) => void;
}

function getGreetingKey(): 'goodMorning' | 'goodAfternoon' | 'goodEvening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'goodMorning';
  if (hour < 18) return 'goodAfternoon';
  return 'goodEvening';
}

function getWeatherIconAndKey(code: number): { icon: string; key: keyof Translations } {
  if (code === 0) return { icon: 'sunny', key: 'weatherClear' };
  if ([1, 2, 3].includes(code)) return { icon: 'partly_cloudy_day', key: 'weatherCloudy' };
  if ([45, 48].includes(code)) return { icon: 'foggy', key: 'weatherFoggy' };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { icon: 'rainy', key: 'weatherRainy' };
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: 'weather_snowy', key: 'weatherSnowy' };
  if ([95, 96, 99].includes(code)) return { icon: 'thunderstorm', key: 'weatherStormy' };
  return { icon: 'sunny', key: 'weatherClear' };
}

function getTempAdviceKey(temp: number): keyof Translations {
  if (temp >= 26) return 'stayCool';
  if (temp >= 15) return 'lightLayers';
  if (temp >= 5) return 'keepWarm';
  return 'bundleUp';
}

export default function HomeTab({ user, onNavigateToScan, onViewItem }: HomeTabProps) {
  const { t, language } = useTranslation();
  const INITIAL_OUTFITS = getInitialOutfits(language);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [weather, setWeather] = useState<{
    temp: number | null;
    code: number | null;
    loading: boolean;
    error: string | null;
  }>({ temp: null, code: null, loading: true, error: null });

  useEffect(() => {
    if (!navigator.geolocation) {
      setWeather({ temp: null, code: null, loading: false, error: 'locationDenied' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
          if (!response.ok) throw new Error('Weather fetch failed');
          const data = await response.json();
          setWeather({
            temp: typeof data.temperature === 'number' ? data.temperature : null,
            code: typeof data.weathercode === 'number' ? data.weathercode : null,
            loading: false,
            error: null,
          });
        } catch (err) {
          setWeather({ temp: null, code: null, loading: false, error: 'weatherUnavailable' });
        }
      },
      () => {
        setWeather({ temp: null, code: null, loading: false, error: 'locationDenied' });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  }, []);

  let weatherTitle = t('weatherSunny');
  let weatherIcon = 'sunny';
  let weatherAdvice = t('lightLayers');

  if (weather.loading) {
    weatherTitle = t('weatherLoading');
    weatherAdvice = '';
  } else if (weather.error) {
    weatherTitle = t(weather.error as keyof Translations);
    weatherIcon = 'sunny';
    weatherAdvice = '';
  } else if (weather.temp !== null && weather.code !== null) {
    const info = getWeatherIconAndKey(weather.code);
    weatherIcon = info.icon;
    weatherTitle = `${t(info.key)} ${Math.round(weather.temp)}°C`;
    weatherAdvice = t(getTempAdviceKey(weather.temp));
  }

  // Hardcoded recommendations with gorgeous images from the prompt
  const recommendations = [
    {
      id: 'school',
      scenario: 'School',
      scenarioKey: 'scenarioSchool',
      titleKey: 'recommendationSchoolTitle',
      descKey: 'recommendationSchoolDesc',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0I2XTz8PhphuIcrCA3S22OuduwzQ5SD3owmAzyD_ZGB8h3cuS7RJXYQlG4oUq0f6OPjW1yE4c6ZovqJwESISeY1tk2Qx1AErbwzmafnZrdfwq4Q9v7VbxIVrFX62clr8VnG4TVDRlqLeBy6xiM7ZHyAuOakBUqKl3EfePcQsF-WNjFw9y2_uCdB77b0azF6MRcwa3FUO64Q5qo3KacMrF_x87yd3ZfBXeBYnGK6QnCsYpW-VgpdY',
      items: [
        { name: 'Navy Cardigan', brand: 'Theory', material: 'Textured Cotton', color: 'Navy' },
        { name: 'Relaxed Denim', brand: 'Levi\'s', material: 'Organic Denim', color: 'Light Indigo' }
      ]
    },
    {
      id: 'work',
      scenario: 'Work',
      scenarioKey: 'scenarioWork',
      titleKey: 'recommendationWorkTitle',
      descKey: 'recommendationWorkDesc',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDl0aMuphXP34niWVCR1EqigQZCVekAg9cnRg50pJ8TOYF5ETbk14cOOLhgn2kRM6DOcP0M0TMtQ4d3tf_y2Ay2kyWMWarqt5wxan_uyRVH7xqLw7rHVDPl6DCU6irN9e1srrXKZ441aOI4VeKQi9FvZCYgat9s7T-kojS6V5H-yOcrL6z8J4LezVGPPYh4K0mD5vEL5_Kq3mBnf-jLqhqz9I7T3eXN5WrPsWONnMreyO5B6jVQIoM',
      items: [
        { name: 'Oversized Blazer', brand: 'The Row', material: 'Fine Wool blend', color: 'Charcoal' },
        { name: 'Black Turtleneck', brand: 'Celine', material: 'Cashmere-Silk', color: 'Black' }
      ]
    },
    {
      id: 'date',
      scenario: 'Date',
      scenarioKey: 'scenarioDate',
      titleKey: 'recommendationDateTitle',
      descKey: 'recommendationDateDesc',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEpoOvjlvr73VlFQTJoVyFFGPX0qU1ieCoWHZO0ypX0RZ2otjwQOCGcCw3c9Xm-2pbaiIxmWQ5Wwj2OF4fHz09_NL1L0hWDRA7MwavdWxFYiE5FXOfhl7ZaseCu8YK8miIz9H1xn3suxuFQwnRbHkyhMkx_eepZcLgUr9AJaSy7L8iFzY2wU5KT9azoC6rz78-H57L3mEUxpeL40Pg-H3K2kS8dXQnkRRxxT5mD5JpEF5pv2m7Ucg',
      items: [
        { name: 'Silk Slip Dress', brand: 'La Perla', material: 'Mulberry Silk', color: 'Emerald' },
        { name: 'Structured Leather Jacket', brand: 'Saint Laurent', material: 'Nappa Leather', color: 'Black' }
      ]
    },
    {
      id: 'weekend',
      scenario: 'Weekend',
      scenarioKey: 'scenarioWeekend',
      titleKey: 'recommendationWeekendTitle',
      descKey: 'recommendationWeekendDesc',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0YxDsde2x0cWMjhsJAyrLR3d3ujDbNuHH7hqS_a_2oWDuCniZJAV0L39vg5CiuGO4ww-hDo0vRp3BIM4s4J4j5rrl9g6B3_-PqXyTNgqEGSwR_tUj6ku5WeEe0-JCJGGj-Vq-Qq6Z9NFp55iK8DdyJbSil7OJjdBxxexCNoX84jfCDvI0jZ7Jwaw57zPDHeXJQ_X_9O0aO6N-hq7eq7J-XMS7gjZvh0LlGPE9pkkLbzL0-ud3q7g',
      items: [
        { name: 'Oversized Beige Hoodie', brand: 'Loro Piana', material: 'Cashmere-Cotton', color: 'Beige' },
        { name: 'Relaxed Joggers', brand: 'Loro Piana', material: 'Cashmere-Cotton', color: 'Beige' }
      ]
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <section className="flex justify-between items-center bg-white/40 p-4 rounded-2xl border border-white/20 backdrop-blur-md">
        <div>
          <h2 className="font-display text-2xl lg:text-3xl font-extrabold text-primary">
            {t(getGreetingKey())}, {user.name}.
          </h2>
          <p className="text-sm font-medium text-on-surface-variant">
            {t('welcomeSubtitle')}
          </p>
        </div>
        {user.avatar && (
          <img
            src={user.avatar}
            alt="Profile Avatar"
            className="w-12 h-12 rounded-full border border-primary/20 object-cover"
          />
        )}
      </section>

      {/* Weather & Outfit Recommendation Card */}
      <section>
        <div className="glass-card rounded-3xl overflow-hidden relative shadow-[0px_8px_32px_rgba(42,45,124,0.06)] min-h-[220px] flex flex-col md:flex-row">
          <div className="relative z-10 p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined filled text-on-tertiary-container text-lg">{weatherIcon}</span>
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  {t('todayForecast')}
                </span>
              </div>
              <h3 className="font-display text-2xl lg:text-3xl font-extrabold text-[#191c1e]">
                {weatherTitle}
              </h3>
              {weatherAdvice && (
                <p className="text-sm lg:text-base font-semibold text-primary mt-2">
                  {weatherAdvice}
                </p>
              )}
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  // Preload Commute Outfit as a selection
                  const commuteOutfit = INITIAL_OUTFITS.find(o => o.scenario === 'Commute');
                  if (commuteOutfit) setSelectedOutfit(commuteOutfit);
                }}
                className="bg-primary text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all cursor-pointer shadow-sm shadow-primary/10"
              >
                {t('viewDetails')}
              </button>
            </div>
          </div>
          <div className="relative z-10 w-full md:w-1/2 h-56 md:h-auto overflow-hidden">
            <img
              className="w-full h-full object-cover"
              alt="Sunny day curated outfit layout"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtHK52otPuK1nwJdljWSqodSHq28vuhf1gVc_FQZb_iXx2G7kw7dYwSrHbOqM7wrXcSurdtsvn9ByuAXnBkb_sRFEx5aqYm6bOUDi2z47LBJJ2WLmehTT8POUHiQbPjeYIjGlrlmSLpp23pPjgHtb3PqV99xLFSP2p1FLtTqa4aYuIDpv_5VkKPDFTQ5uA3Mqwtqyhzz4YLB--M3xvwZlegFIm85BLsBn1fo6JPu9P-ttZb5awl2Q"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/60 to-transparent md:from-transparent" />
          </div>
        </div>
      </section>

      {/* Quick Recommendations Grid */}
      <section>
        <div className="flex justify-between items-end mb-4 px-1">
          <h3 className="font-display text-lg lg:text-xl font-bold text-primary">
            {t('quickRecommendations')}
          </h3>
          <span className="text-xs font-semibold text-on-primary-container">
            {t('aiPersonalizedPicks')}
          </span>
        </div>

        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x snap-mandatory">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              onClick={() => {
                // Map to a complete styled outfit modal for extreme fidelity!
                const matchedOutfit = INITIAL_OUTFITS.find(o => o.scenario === rec.scenario) || {
                  id: rec.id,
                  name: t(rec.titleKey as keyof typeof import('../i18n/translations').translations['zh-CN']),
                  scenario: rec.scenario as any,
                  image: rec.image,
                  tempPerfect: t('perfectSilhouette'),
                  curationNotes: [
                    {
                      icon: 'auto_awesome',
                      title: t('sophisticatedMatch'),
                      content: t(rec.descKey as keyof typeof import('../i18n/translations').translations['zh-CN']),
                      bgClass: 'bg-primary-fixed',
                      iconClass: 'text-on-primary-fixed-variant'
                    }
                  ],
                  items: rec.items as any
                };
                setSelectedOutfit(matchedOutfit);
              }}
              className="min-w-[210px] w-[210px] flex-shrink-0 snap-start group cursor-pointer"
            >
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden mb-2 shadow-sm border border-white/40 bg-surface-container-low">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={t(rec.titleKey as keyof typeof import('../i18n/translations').translations['zh-CN'])}
                  src={rec.image}
                />
                <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/50">
                  <span className="text-[11px] font-bold text-primary">{t(rec.scenarioKey as keyof typeof import('../i18n/translations').translations['zh-CN'])}</span>
                </div>
              </div>
              <p className="text-xs font-bold text-on-background px-1 truncate">{t(rec.titleKey as keyof typeof import('../i18n/translations').translations['zh-CN'])}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section to Launch AI Scanner */}
      <section>
        <div className="bg-primary-container p-8 rounded-3xl relative overflow-hidden text-center shadow-xl">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-on-primary-container/20 rounded-full blur-3xl" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-on-tertiary-container/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col items-center">
            <span className="material-symbols-outlined text-on-primary-container text-5xl mb-4 animate-pulse">
              smart_toy
            </span>
            <h3 className="font-display text-xl lg:text-2xl font-extrabold text-white mb-2">
              {t('newArrival')}
            </h3>
            <p className="text-sm text-on-primary-container/90 mb-8 max-w-sm mx-auto leading-relaxed">
              {t('newArrivalDesc')}
            </p>
            <button
              type="button"
              onClick={onNavigateToScan}
              className="bg-white text-primary px-8 py-4 rounded-full font-display text-sm font-bold shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer hover:bg-white/95"
            >
              <span className="material-symbols-outlined text-primary text-xl">document_scanner</span>
              {t('startAiScan')}
            </button>
          </div>
        </div>
      </section>

      {/* Modal: Styled Recommendation Details */}
      {selectedOutfit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#f8f9fc] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/30 max-h-[90vh] flex flex-col animate-fade-in">
            {/* Top Bar */}
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-white/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary filled">auto_awesome</span>
                <h3 className="font-display font-extrabold text-primary text-lg">{t('aiStylingSuggestion')}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOutfit(null)}
                className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-[#191c1e] hover:bg-surface-container transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Content Scrolling */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Cover Image */}
              <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-surface-container">
                <img src={selectedOutfit.image} alt={selectedOutfit.name} className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">
                  {selectedOutfit.tempPerfect}
                </div>
              </div>

              {/* Title Block */}
              <div>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  {t('styleCuration', { scenario: selectedOutfit.scenario })}
                </span>
                <h4 className="font-display text-2xl font-extrabold text-primary mt-1">
                  {selectedOutfit.name}
                </h4>
              </div>

              {/* Curation notes details */}
              <div className="space-y-4">
                {selectedOutfit.curationNotes.map((note, idx) => (
                  <div key={idx} className="glass-card p-4 rounded-2xl flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${note.bgClass || 'bg-primary-fixed'}`}>
                      <span className={`material-symbols-outlined text-lg ${note.iconClass || 'text-on-primary-fixed-variant'}`}>
                        {note.icon}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[#191c1e]">{note.title}</p>
                      <p className="text-xs text-on-surface-variant leading-relaxed">{note.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ensemble breakdown */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-outline mb-3">
                  {t('ensembleBreakdown')}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {selectedOutfit.items?.map((item: any, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (item.id) {
                          onViewItem(item);
                          setSelectedOutfit(null);
                        }
                      }}
                      className={`bg-surface-container-low rounded-2xl p-3 flex flex-col gap-2 ${
                        item.id ? 'cursor-pointer hover:shadow-md transition-all' : ''
                      }`}
                    >
                      {item.image && (
                        <div className="aspect-square rounded-xl overflow-hidden bg-white">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-[#191c1e] truncate">{item.name}</p>
                        <p className="text-[10px] text-on-surface-variant font-medium">{item.brand}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-6 border-t border-outline-variant/30 flex gap-4 bg-white/40">
              <button
                type="button"
                onClick={() => {
                  alert(t('lookApplied', { scenario: selectedOutfit.scenario }));
                  setSelectedOutfit(null);
                }}
                className="flex-1 py-4 bg-primary text-white rounded-full font-display font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-lg shadow-primary/10"
              >
                <span className="material-symbols-outlined text-white text-base">checkroom</span>
                {t('wearOutfit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
