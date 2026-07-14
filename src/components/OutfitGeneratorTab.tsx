import React, { useState, useRef } from 'react';
import { Item, UserProfile } from '../types';
import { useTranslation } from '../i18n';

interface OutfitGeneratorTabProps {
  user: UserProfile;
  items: Item[];
}

export default function OutfitGeneratorTab({ user, items }: OutfitGeneratorTabProps) {
  const { t, language } = useTranslation();
  const [step, setStep] = useState<'photo' | 'select' | 'generating' | 'result'>('photo');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profilePhotoPath, setProfilePhotoPath] = useState<string | null>(null);
  const [selectedTop, setSelectedTop] = useState<Item | null>(null);
  const [selectedBottom, setSelectedBottom] = useState<Item | null>(null);
  const [selectedShoes, setSelectedShoes] = useState<Item | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tops = items.filter((it) => it.category === 'tops');
  const bottoms = items.filter((it) => it.category === 'bottoms');
  const shoes = items.filter((it) => it.category === 'shoes');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setProfilePhoto(dataUrl);
      await uploadProfilePhoto(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const uploadProfilePhoto = async (imageSrc: string) => {
    if (!user.id) {
      setError(t('loginRequired'));
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      const response = await fetch('/api/upload-profile-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageSrc, userId: user.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      setProfilePhotoPath(data.profilePhotoPath);
      setStep('select');
    } catch (err: any) {
      setError(err.message || t('error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!user.id || !profilePhoto) return;
    setIsGenerating(true);
    setError(null);
    setStep('generating');
    try {
      const response = await fetch('/api/generate-outfit-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          profilePhoto,
          topImage: selectedTop?.image,
          bottomImage: selectedBottom?.image,
          shoesImage: selectedShoes?.image,
          language,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }
      setOutputImage(data.outputImagePath);
      setStep('result');
    } catch (err: any) {
      setError(err.message || t('error'));
      setStep('select');
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = selectedTop || selectedBottom || selectedShoes;

  const renderItemGrid = (categoryItems: Item[], selected: Item | null, onSelect: (item: Item) => void, label: string) => (
    <div className="space-y-2">
      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{label}</p>
      {categoryItems.length === 0 ? (
        <p className="text-xs text-on-surface-variant">{t('noItemsHint')}</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {categoryItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(selected?.id === item.id ? null as any : item)}
              className={`relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all ${
                selected?.id === item.id ? 'border-primary scale-[1.02] shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
              }`}
            >
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              {selected?.id === item.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-sm filled">check</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-lg mx-auto pb-16">
      <section className="flex flex-col gap-2">
        <h2 className="font-display text-2xl lg:text-3xl font-extrabold text-primary">{t('outfitGenerator')}</h2>
        <p className="text-sm font-medium text-on-surface-variant">{t('outfitGeneratorDesc')}</p>
      </section>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-2xl text-error text-xs font-medium">
          {error}
        </div>
      )}

      {step === 'photo' && (
        <section className="bg-primary-container p-8 rounded-3xl relative overflow-hidden text-center shadow-xl">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-on-primary-container/20 rounded-full blur-3xl" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-on-tertiary-container/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col items-center">
            <span className="material-symbols-outlined text-on-primary-container text-5xl mb-4 animate-pulse">face</span>
            <h3 className="font-display text-xl lg:text-2xl font-extrabold text-white mb-2">{t('uploadFrontalPhoto')}</h3>
            <p className="text-sm text-on-primary-container/90 mb-8 max-w-sm mx-auto leading-relaxed">
              {t('uploadFrontalPhotoDesc')}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-white text-primary px-8 py-4 rounded-full font-display text-sm font-bold shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer hover:bg-white/95 disabled:opacity-70"
            >
              <span className="material-symbols-outlined text-primary text-xl">photo_camera</span>
              {isUploading ? t('uploading') : t('selectPhoto')}
            </button>
          </div>
        </section>
      )}

      {step === 'select' && (
        <section className="space-y-6">
          {profilePhoto && (
            <div className="relative rounded-3xl overflow-hidden aspect-[3/4] max-w-xs mx-auto shadow-md">
              <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setStep('photo')}
                className="absolute top-3 left-3 bg-white/90 px-3 py-1.5 rounded-full text-xs font-bold text-primary shadow-sm"
              >
                {t('changePhoto')}
              </button>
            </div>
          )}

          {renderItemGrid(tops, selectedTop, setSelectedTop, t('tops'))}
          {renderItemGrid(bottoms, selectedBottom, setSelectedBottom, t('bottoms'))}
          {renderItemGrid(shoes, selectedShoes, setSelectedShoes, t('shoes'))}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="w-full py-4 bg-primary text-white rounded-xl font-display font-bold text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:bg-primary-container active:scale-95 transition-all cursor-pointer disabled:opacity-70"
          >
            <span className="material-symbols-outlined text-white text-base">auto_awesome</span>
            {t('generateOutfitVisual')}
          </button>
        </section>
      )}

      {step === 'generating' && (
        <section className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <span className="absolute inset-0 flex items-center justify-center material-symbols-outlined text-primary text-2xl animate-pulse">auto_awesome</span>
          </div>
          <div className="text-center space-y-1">
            <h4 className="font-display font-bold text-primary">{t('generatingOutfitVisual')}</h4>
            <p className="text-xs text-on-surface-variant animate-pulse font-medium">{t('nanoBananaGenerating')}</p>
          </div>
        </section>
      )}

      {step === 'result' && outputImage && (
        <section className="space-y-6">
          <div className="relative rounded-3xl overflow-hidden aspect-[3/4] bg-surface-container shadow-md">
            <img src={outputImage} alt="Generated outfit" className="w-full h-full object-cover" />
            <div className="absolute top-4 right-4 bg-primary-container text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md">
              {t('outfitResult')}
            </div>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep('select')}
              className="flex-1 py-4 border border-outline-variant rounded-full font-display font-semibold text-sm text-on-surface-variant hover:bg-surface-container-low active:scale-95 transition-all cursor-pointer"
            >
              {t('back')}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedTop(null);
                setSelectedBottom(null);
                setSelectedShoes(null);
                setOutputImage(null);
                setStep('photo');
              }}
              className="flex-1 py-4 bg-primary text-white rounded-full font-display font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-lg shadow-primary/10"
            >
              {t('generateAgain')}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
