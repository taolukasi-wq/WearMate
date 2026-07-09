import React, { useState } from 'react';
import { Item, UserProfile } from '../types';
import { useTranslation } from '../i18n';

interface ProductDetailProps {
  item: Item;
  closetItems: Item[];
  user: UserProfile;
  onBack: () => void;
  onToggleFavorite: (itemId: string) => void;
  onSelectRelatedItem: (relatedItem: Item) => void;
}

export default function ProductDetail({
  item,
  closetItems,
  user,
  onBack,
  onToggleFavorite,
  onSelectRelatedItem,
}: ProductDetailProps) {
  const { t } = useTranslation();
  const [isLookbookGenerating, setIsLookbookGenerating] = useState(false);
  const [generatedLookbookNotes, setGeneratedLookbookNotes] = useState<string | null>(null);

  // Suggest other complementary items from the user's actual closet
  // e.g., if item is a Top, suggest Shoes or Bottoms. Otherwise suggest Tops/Accessories
  const complementaryItems = closetItems
    .filter((cl) => cl.id !== item.id)
    .filter((cl) => {
      if (item.category === 'tops') return cl.category === 'bottoms' || cl.category === 'shoes';
      if (item.category === 'bottoms') return cl.category === 'tops' || cl.category === 'shoes';
      if (item.category === 'shoes') return cl.category === 'bottoms' || cl.category === 'accessories';
      return cl.category === 'tops' || cl.category === 'shoes';
    })
    .slice(0, 2);

  const handleGenerateLookbook = () => {
    setIsLookbookGenerating(true);
    setGeneratedLookbookNotes(null);

    // Call simulated custom lookbook styling after a small elegant delay
    setTimeout(() => {
      setGeneratedLookbookNotes(
        t('lookbookDesc', { name: item.name })
      );
      setIsLookbookGenerating(false);
    }, 1800);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Navigation */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-primary font-display font-bold text-xs uppercase tracking-wider hover:translate-x-[-4px] transition-transform cursor-pointer"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        {t('backToCloset')}
      </button>

      {/* Main product visual and key specs */}
      <section className="flex flex-col md:flex-row gap-8 bg-white/40 p-6 rounded-3xl border border-white/20 backdrop-blur-md">
        {/* Cover image with favorite button absolute */}
        <div className="relative w-full md:w-1/2 aspect-[3/4] rounded-2xl overflow-hidden glass-card shadow-md bg-surface-container-low">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          <button
            onClick={() => onToggleFavorite(item.id)}
            className="absolute top-4 right-4 bg-white/95 w-10 h-10 rounded-full flex items-center justify-center text-primary shadow-md active:scale-90 transition-transform cursor-pointer"
          >
            <span className={`material-symbols-outlined text-base ${item.isFavorite ? 'filled text-red-500' : 'text-[#191c1e]'}`}>
              favorite
            </span>
          </button>
        </div>

        {/* Specifications Sheet */}
        <div className="flex-1 flex flex-col justify-between space-y-6">
          <div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              {item.brand}
            </span>
            <h3 className="font-display text-2xl lg:text-3xl font-extrabold text-primary mt-1">
              {item.name}
            </h3>
            <p className="text-xs text-on-surface-variant font-medium uppercase mt-2 bg-secondary-container inline-block px-3 py-1.5 rounded-full">
              {item.category}
            </p>
          </div>

          <div className="space-y-3.5 border-t border-b border-outline-variant/30 py-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-on-surface-variant font-semibold">{t('designerBrand')}</span>
              <span className="text-primary font-bold">{item.brand}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-on-surface-variant font-semibold">{t('fabricComposition')}</span>
              <span className="text-primary font-bold">{item.material}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-on-surface-variant font-semibold">{t('primaryColor')}</span>
              <span className="flex items-center gap-2 text-primary font-bold">
                {item.color}
                {item.colorHex && (
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-outline-variant/30"
                    style={{ backgroundColor: item.colorHex }}
                  />
                )}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-on-surface-variant font-semibold">{t('sizingSpecs')}</span>
              <span className="text-primary font-bold">{item.size || 'OS'}</span>
            </div>
          </div>

          {/* AI Styling intelligence section */}
          <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 space-y-3 relative overflow-hidden">
            <div className="absolute inset-0 shimmer-bg opacity-20 pointer-events-none" />
            <div className="relative z-10 flex items-center gap-1.5">
              <span className="material-symbols-outlined filled text-primary text-base">auto_awesome</span>
              <span className="text-[11px] font-bold text-primary uppercase tracking-widest">{t('aiStylingIntelligence')}</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {t('stylingIntelligenceDesc', { color: item.color.toLowerCase(), skinTone: user.skinTone || '' })}
            </p>
          </div>
        </div>
      </section>

      {/* Lookbook Generator Action */}
      <section className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">{t('lookbookAiGeneration')}</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Curate an active digital lookbook incorporating your {item.name}. We will synthesize the ensemble relative to current high-fashion aesthetics.
          </p>
        </div>

        {generatedLookbookNotes ? (
          <div className="mt-4 p-4 bg-primary-container rounded-xl text-white text-xs leading-relaxed animate-fade-in font-medium">
            {generatedLookbookNotes}
          </div>
        ) : (
          <button
            type="button"
            disabled={isLookbookGenerating}
            onClick={handleGenerateLookbook}
            className="self-start mt-6 px-6 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-container active:scale-95 transition-transform flex items-center gap-2 cursor-pointer disabled:opacity-85"
          >
            {isLookbookGenerating ? (
              <>
                <span className="material-symbols-outlined animate-spin text-white text-xs">sync</span>
                <span>{t('generatingLook')}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-white text-xs">auto_awesome</span>
                <span>{t('generateLookbook')}</span>
              </>
            )}
          </button>
        )}
      </section>

      {/* Closet Matches: Complementary Wardrobe Coordinates */}
      {complementaryItems.length > 0 && (
        <section className="space-y-4">
          <h4 className="font-display text-lg font-extrabold text-primary">
            {t('perfectClosetMatches')}
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {complementaryItems.map((comp) => (
              <div
                key={comp.id}
                onClick={() => onSelectRelatedItem(comp)}
                className="group glass-card p-4 rounded-2xl cursor-pointer flex gap-4 hover:shadow-md transition-all bg-white/50"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white flex-shrink-0 border border-outline-variant/20">
                  <img src={comp.image} alt={comp.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col justify-center overflow-hidden">
                  <p className="text-xs font-bold text-[#191c1e] truncate">{comp.name}</p>
                  <p className="text-[10px] text-outline font-semibold uppercase tracking-wider">{comp.brand}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
