import React, { useState, useRef } from 'react';
import { Item, UserProfile, Outfit, CurationNote } from '../types';
import { useTranslation } from '../i18n';

interface ClosetTabProps {
  items: Item[];
  user: UserProfile;
  onAddItem: (newItem: Item) => void;
  onViewItem: (item: Item) => void;
}

const FILTER_KEYS: Record<'All' | 'tops' | 'bottoms' | 'shoes' | 'accessories', 'allItems' | 'tops' | 'bottoms' | 'shoes' | 'accessories'> = {
  All: 'allItems',
  tops: 'tops',
  bottoms: 'bottoms',
  shoes: 'shoes',
  accessories: 'accessories',
};

export default function ClosetTab({ items, user, onAddItem, onViewItem }: ClosetTabProps) {
  const { t, language } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<'All' | 'tops' | 'bottoms' | 'shoes' | 'accessories'>('All');
  
  // States for adding a new item
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemBrand, setNewItemBrand] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'tops' | 'bottoms' | 'shoes' | 'accessories'>('tops');
  const [newItemMaterial, setNewItemMaterial] = useState('');
  const [newItemColor, setNewItemColor] = useState('');
  const [newItemSize, setNewItemSize] = useState('');
  const [selectedImagePreset, setSelectedImagePreset] = useState<string>('https://lh3.googleusercontent.com/aida-public/AB6AXuCjibAJDlPwviZO8RZLqRb3zdOlXyfpoUw9FCctbJ09IdwBDkwbYEa4fgdiEsAzIeUD0OB3HDF4865KsiDYdHot9nXD8M9yqd3guh4yU17FnCb_Lqti4ZGSR8ou6D3UtnysFc-z3Ybo6OSNw3XjfbMXLTudIRgKQ81F4YgLJGPlhvOl8JAUzDdwwyn1puJJn3pW0rukqIPoW2nlpVueZ9qYoqMFJmC_nPQc0RRsrqeqk17Dde6wFyo');
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const [isScanningUploadedImage, setIsScanningUploadedImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // States for Mix & Match AI generation
  const [isMixMatchOpen, setIsMixMatchOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<'Commute' | 'Date' | 'Casual'>('Commute');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutfit, setGeneratedOutfit] = useState<Outfit | null>(null);

  // Curated premium preset images to make adding new items extremely rich and easy
  const presetImages = [
    { name: 'Oversized Blazer', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDl0aMuphXP34niWVCR1EqigQZCVekAg9cnRg50pJ8TOYF5ETbk14cOOLhgn2kRM6DOcP0M0TMtQ4d3tf_y2Ay2kyWMWarqt5wxan_uyRVH7xqLw7rHVDPl6DCU6irN9e1srrXKZ441aOI4VeKQi9FvZCYgat9s7T-kojS6V5H-yOcrL6z8J4LezVGPPYh4K0mD5vEL5_Kq3mBnf-jLqhqz9I7T3eXN5WrPsWONnMreyO5B6jVQIoM' },
    { name: 'Cream Slip Dress', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEpoOvjlvr73VlFQTJoVyFFGPX0qU1ieCoWHZO0ypX0RZ2otjwQOCGcCw3c9Xm-2pbaiIxmWQ5Wwj2OF4fHz09_NL1L0hWDRA7MwavdWxFYiE5FXOfhl7ZaseCu8YK8miIz9H1xn3suxuFQwnRbHkyhMkx_eepZcLgUr9AJaSy7L8iFzY2wU5KT9azoC6rz78-H57L3mEUxpeL40Pg-H3K2kS8dXQnkRRxxT5mD5JpEF5pv2m7Ucg' },
    { name: 'Tweed Jacket', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoFgF38VXXdsTVfNUxGCfB2AHitQBM_eiR82mVkLRM2fkCGQrMB-oNYPPq0B82n2F9nhEAg2rV9cP-U9-5rSUxQfI7YJpsOVqGGg6O2ZpCGU0g7vUG3jB2tEsYv5hKVlhQc5a4HaV0kOIsrBY0v8JZ09SedOeJ25mp78xABmzWkhY2YBfu8wOSy72sTwEph6gxTHxaUupgx-p4p-XNbhgJQ1H_LtEKdIqlOVLWegQoJcFIM8Nw1KE' },
    { name: 'Sleek Leather Handbag', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0IHuUvYSD9miBU2WFFMWF1p0fgbpuzRbs56BtqaxP_IxsG0cfrkJouN9jWXZ2cEOMkGtsPjdMhTF1pZGBRSM4Q7YQbkkA14DsXOhxkq4Wob_nsHNVV2OkMu-tw4jLoKBnR6KaZ7DzmJlfMfopN7QgB3FquznkZdEkT451Y2wSF9iI9OWlu2bQs6hBIrxtuZIuAPJs6DnscFj5YiaAeT9tx7zj7QYgdN5IzuZMRRTWXrzHC7tsoyQ' },
    { name: 'Linen Wide Trousers', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCj7IJSPLc5BstqHSeKBGHh5YT0Lb0HlVHRcs4RqQPVzk-j0tyhi1uxVqUfjoEDdz94dDJKr1MkS9exkY5n4cSDKiEeWMwW4OonFoO-aGOFXUfNuQa7LvHrDoPrVka09CjeSNoX2dwNHIZUGjR6U2r5ZO3Nn1sn1rgbKizVYrfEdRy1HZgzyNRuZ1hLAqtdnElLaVa3owva-wxBF72R-d9E6pbpJXQhHZvhvnFLQfwBrqUsyOjBcw' },
    { name: 'Mahogany Heels', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFa9zBYOFR7Kit7_1lx00nmnP8mKt9H1qflj5Ug0SoTjSJijMmZ9up6Ww-MhWexX3mEIZe87fbBLHDmdY_wdRaI3NcbdwtglvEoRJaMVfwtr_uvLp7ZKRXeixrwSKcvLqoASIITmlvfHcXZ3GhOSs4Yb2VJT35B4HjY8xSRo4VlOfs1u2M7f1pEYDA94U4Q6e9TnOkVyrDndHyT8A87ZRwKwbk6qCZ6r7-Jhe8Q3qw3v1KApWBqoI' }
  ];

  // Filters the digital closet
  const filteredItems = items.filter((it) => {
    if (activeFilter === 'All') return true;
    return it.category === activeFilter;
  });

  const resetAddItemForm = () => {
    setNewItemName('');
    setNewItemBrand('');
    setNewItemCategory('tops');
    setNewItemMaterial('');
    setNewItemColor('');
    setNewItemSize('');
    setNewItemImage(null);
    setIsScanningUploadedImage(false);
    stopCamera();
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing },
        audio: false,
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn('Camera could not start:', err);
      setCameraError(t('cameraNotAvailable'));
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setTimeout(() => {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: nextFacing }, audio: false })
        .then((stream) => {
          setCameraStream(stream);
          setIsCameraActive(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Camera could not switch:', err);
          setCameraError(t('cameraNotAvailable'));
        });
    }, 50);
  };

  const handleCaptureFromCamera = () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setNewItemImage(dataUrl);
        stopCamera();
      }
    } catch (err) {
      alert(t('captureError'));
    }
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemBrand) return;

    onAddItem({
      id: Date.now().toString(),
      name: newItemName,
      brand: newItemBrand,
      category: newItemCategory,
      material: newItemMaterial || 'Premium blend',
      color: newItemColor || 'Classic Neutral',
      colorHex: '#C5C5D8',
      size: newItemSize || 'OS',
      image: newItemImage || selectedImagePreset,
      isFavorite: false,
    });

    resetAddItemForm();
    setIsAddModalOpen(false);
  };

  // Upload a photo for the new item
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setNewItemImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setNewItemImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Optional AI scan to auto-fill item fields from the uploaded photo
  const handleAutoFillFromImage = async () => {
    if (!newItemImage) return;
    setIsScanningUploadedImage(true);
    try {
      const response = await fetch('/api/scan-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: newItemImage, userId: user.id, language }),
      });
      if (!response.ok) throw new Error('Scan failed');
      const data = await response.json();
      if (data.name) setNewItemName(data.name);
      if (data.brand) setNewItemBrand(data.brand);
      if (data.category) setNewItemCategory(data.category);
      if (data.material) setNewItemMaterial(data.material);
      if (data.color) setNewItemColor(data.color);
      if (data.savedImagePath) setNewItemImage(data.savedImagePath);
    } catch (err) {
      console.error('Auto-fill failed:', err);
      alert(t('mixMatchError'));
    } finally {
      setIsScanningUploadedImage(false);
    }
  };

  // Mix & Match AI logic calling server-side express route
  const handleMixAndMatch = async () => {
    setIsGenerating(true);
    setGeneratedOutfit(null);

    try {
      const response = await fetch('/api/mix-match-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items,
          scenario: selectedScenario,
          userProfile: user,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate customized mix-match look.');
      }

      const data = await response.json();

      // Curate a beautiful mockup image based on chosen scenario to keep absolute high visual design fidelity
      let scenarioImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkgvRRIoxnzEGrjNxf9r_qxVUvsfQLoGS6x0O_t20xismypTuOFOzHwkfnNJUwyl2T_DzZR8qy0N56Pd0859cKD730FCy6ElfaQ82VyIqS_WJNHIOOdRDch7VEsW_kOHqETcun0WuiRQHZ9gLVQ9fOi9Ypv6Uw5cgLgusZcIcecUhvsWdNiXvvNs3yALpTPnEXsz0kZsFIw8MGu_TzyXZz90iLe172iwTRtnujpru4huTYhrKgR3A';
      if (selectedScenario === 'Date') {
        scenarioImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEpoOvjlvr73VlFQTJoVyFFGPX0qU1ieCoWHZO0ypX0RZ2otjwQOCGcCw3c9Xm-2pbaiIxmWQ5Wwj2OF4fHz09_NL1L0hWDRA7MwavdWxFYiE5FXOfhl7ZaseCu8YK8miIz9H1xn3suxuFQwnRbHkyhMkx_eepZcLgUr9AJaSy7L8iFzY2wU5KT9azoC6rz78-H57L3mEUxpeL40Pg-H3K2kS8dXQnkRRxxT5mD5JpEF5pv2m7Ucg';
      } else if (selectedScenario === 'Casual') {
        scenarioImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0I2XTz8PhphuIcrCA3S22OuduwzQ5SD3owmAzyD_ZGB8h3cuS7RJXYQlG4oUq0f6OPjW1yE4c6ZovqJwESISeY1tk2Qx1AErbwzmafnZrdfwq4Q9v7VbxIVrFX62clr8VnG4TVDRlqLeBy6xiM7ZHyAuOakBUqKl3EfePcQsF-WNjFw9y2_uCdB77b0azF6MRcwa3FUO64Q5qo3KacMrF_x87yd3ZfBXeBYnGK6QnCsYpW-VgpdY';
      }

      const parsedOutfit: Outfit = {
        id: 'generated-' + Date.now(),
        name: data.outfitName,
        scenario: selectedScenario,
        image: scenarioImage,
        tempPerfect: data.tempPerfect,
        curationNotes: [
          {
            icon: data.note1Icon || 'palette',
            title: data.note1Title,
            content: data.note1Content,
            bgClass: 'bg-primary-fixed',
            iconClass: 'text-on-primary-fixed-variant'
          },
          {
            icon: data.note2Icon || 'cloud_queue',
            title: data.note2Title,
            content: data.note2Content,
            bgClass: 'bg-secondary-fixed',
            iconClass: 'text-on-secondary-fixed-variant'
          }
        ],
        // Match with some items from the user's actual closet
        items: items.slice(0, 2),
      };

      setGeneratedOutfit(parsedOutfit);
    } catch (error) {
      console.error(error);
      alert(t('mixMatchError'));
      // fallback
      setGeneratedOutfit({
        id: 'fallback',
        name: t('fallbackOutfitName'),
        scenario: selectedScenario,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkgvRRIoxnzEGrjNxf9r_qxVUvsfQLoGS6x0O_t20xismypTuOFOzHwkfnNJUwyl2T_DzZR8qy0N56Pd0859cKD730FCy6ElfaQ82VyIqS_WJNHIOOdRDch7VEsW_kOHqETcun0WuiRQHZ9gLVQ9fOi9Ypv6Uw5cgLgusZcIcecUhvsWdNiXvvNs3yALpTPnEXsz0kZsFIw8MGu_TzyXZz90iLe172iwTRtnujpru4huTYhrKgR3A',
        tempPerfect: '21°C Comfort',
        curationNotes: [
          {
            icon: 'auto_awesome',
            title: t('fallbackNoteTitle'),
            content: t('fallbackNoteContent'),
            bgClass: 'bg-primary-fixed',
            iconClass: 'text-on-primary-fixed-variant'
          }
        ],
        items: items.slice(0, 2)
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative pb-16">
      {/* Header and Status */}
      <section className="flex flex-col gap-2">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-display text-2xl lg:text-3xl font-extrabold text-primary">{t('myCloset')}</h2>
            <p className="text-sm font-medium text-on-surface-variant">{t('closetSubtitle')}</p>
          </div>
          <div className="flex items-center gap-2 bg-secondary-container px-4 py-2 rounded-xl shadow-sm">
            <span className="font-display font-extrabold text-primary">{items.length}</span>
            <span className="text-[10px] font-bold text-on-secondary-container uppercase tracking-wider">
              {t('totalItems')}
            </span>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
          {(['All', 'tops', 'bottoms', 'shoes', 'accessories'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex-shrink-0 px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeFilter === filter
                  ? 'bg-primary text-white shadow-sm glow-accent'
                  : 'glass-card text-on-surface-variant hover:bg-secondary-container/40'
              }`}
            >
              {t(FILTER_KEYS[filter])}
            </button>
          ))}
        </div>
      </section>

      {/* Grid of Items */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => onViewItem(item)}
            className="group relative flex flex-col gap-2 cursor-pointer"
          >
            <div className="aspect-[3/4] rounded-2xl overflow-hidden glass-card relative transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md bg-surface-container-low">
              <img className="w-full h-full object-cover" alt={item.name} src={item.image} />
              {item.isFavorite && (
                <div className="absolute top-3 right-3 bg-white/90 w-8 h-8 rounded-full flex items-center justify-center text-primary shadow-sm">
                  <span className="material-symbols-outlined filled text-red-500 text-sm">favorite</span>
                </div>
              )}
            </div>
            <div className="px-1">
              <p className="text-xs font-bold text-[#191c1e] leading-tight truncate">{item.name}</p>
              <p className="text-[10px] text-outline font-semibold uppercase tracking-wider">{item.brand}</p>
            </div>
          </div>
        ))}

        {/* Add New Item Dashed Placeholder */}
        <div className="group relative flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="aspect-[3/4] rounded-2xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-3 hover:bg-surface-container-low hover:border-primary/40 transition-all group active:scale-[0.98] cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
              <span className="material-symbols-outlined text-2xl">photo_camera</span>
            </div>
            <span className="text-xs font-bold text-on-surface-variant">{t('addNewItem')}</span>
          </button>
        </div>
      </section>

      {/* AI Closet Analysis Box */}
      <section className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group">
        <div className="absolute inset-0 shimmer-bg opacity-30 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">{t('closetAnalysis')}</span>
          </div>
          <p className="font-display text-lg font-extrabold text-primary mb-2">
            {t('closetCohesive')}
          </p>
          <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm">
            {t('closetAnalysisDesc')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedScenario('Casual');
            setIsMixMatchOpen(true);
          }}
          className="relative z-10 self-start mt-6 px-6 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-container active:scale-95 transition-transform cursor-pointer"
        >
          {t('viewSuggestions')}
        </button>
      </section>

      {/* Persistent floating AI Mix & Match button */}
      <div className="fixed bottom-24 right-5 z-40">
        <button
          onClick={() => setIsMixMatchOpen(true)}
          className="flex items-center gap-2.5 bg-primary text-white px-6 py-4 rounded-full shadow-xl glow-accent active:scale-95 transition-all group relative cursor-pointer"
        >
          <span className="material-symbols-outlined filled text-white animate-pulse">smart_toy</span>
          <span className="text-xs font-bold font-display tracking-wide">{t('mixMatch')}</span>
        </button>
      </div>

      {/* Modal: Add New Item */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#f8f9fc] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/30 max-h-[90vh] flex flex-col animate-fade-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-white/40">
              <h3 className="font-display font-extrabold text-primary text-lg">{t('addProductToCloset')}</h3>
              <button
                type="button"
                onClick={() => {
                  resetAddItemForm();
                  setIsAddModalOpen(false);
                }}
                className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-[#191c1e] hover:bg-surface-container transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddNewItem} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 ml-1">
                  {t('productName')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('placeholderProductName')}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 ml-1">
                    {t('designerBrand')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('placeholderBrand')}
                    value={newItemBrand}
                    onChange={(e) => setNewItemBrand(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 ml-1">
                    {t('category')}
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="w-full px-4 py-3 bg-white border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  >
                    <option value="tops">{t('tops')}</option>
                    <option value="bottoms">{t('bottoms')}</option>
                    <option value="shoes">{t('shoes')}</option>
                    <option value="accessories">{t('accessories')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 ml-1">
                    {t('materialFabric')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('placeholderMaterial')}
                    value={newItemMaterial}
                    onChange={(e) => setNewItemMaterial(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 ml-1">
                    {t('color')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('placeholderColor')}
                    value={newItemColor}
                    onChange={(e) => setNewItemColor(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 ml-1">
                    {t('size')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('placeholderSize')}
                    value={newItemSize}
                    onChange={(e) => setNewItemSize(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                </div>
              </div>

              {/* Upload or take a photo */}
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 ml-1">
                  {t('uploadOrTakePhoto')}
                </label>

                {newItemImage ? (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden aspect-square bg-surface-container">
                      <img src={newItemImage} alt="Uploaded item" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewItemImage(null)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoFillFromImage}
                      disabled={isScanningUploadedImage}
                      className="w-full py-3 bg-secondary-container text-on-secondary-container rounded-xl font-display font-semibold text-xs flex items-center justify-center gap-2 hover:bg-secondary-container/80 active:scale-95 transition-all cursor-pointer disabled:opacity-70"
                    >
                      {isScanningUploadedImage ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                          {t('analyzing')}
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined filled text-sm">auto_awesome</span>
                          {t('aiScan')} ({t('scanHint')})
                        </>
                      )}
                    </button>
                  </div>
                ) : isCameraActive ? (
                  <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-neutral-950 shadow-lg">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/60 transition-all cursor-pointer"
                      title={t('flipCamera')}
                    >
                      <span className="material-symbols-outlined text-lg">flip_camera_ios</span>
                    </button>
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-xs font-bold hover:bg-white/20 transition-all cursor-pointer"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={handleCaptureFromCamera}
                        className="w-16 h-16 bg-white rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-2xl cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-full border-2 border-primary/20" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative rounded-2xl border-2 border-dashed transition-all p-6 flex flex-col items-center justify-center gap-3 cursor-pointer ${
                        isDragging
                          ? 'border-primary bg-primary/5 scale-[1.01]'
                          : 'border-outline-variant bg-surface-container-low hover:border-primary/40 hover:bg-surface-container'
                      }`}
                    >
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant">cloud_upload</span>
                      <div className="text-center">
                        <p className="text-sm font-bold text-on-surface-variant">{t('dragDropImage')}</p>
                        <p className="text-xs text-outline mt-1">{t('uploadFileHint')}</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-display font-semibold text-xs shadow-lg shadow-primary/10 hover:bg-primary-container active:scale-95 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">photo_camera</span>
                        {t('takePhoto')}
                      </button>
                      <label className="flex items-center justify-center gap-2 py-3 bg-surface-container text-on-surface-variant rounded-xl font-display font-semibold text-xs border border-outline-variant hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer">
                        <span className="material-symbols-outlined text-sm">collections</span>
                        {t('selectFromAlbum')}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>

                    {cameraError && (
                      <p className="text-xs text-error text-center font-medium">{cameraError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Photo presets selection */}
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 ml-1">
                  {t('chooseProductPhoto')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {presetImages.map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedImagePreset(p.url);
                        setNewItemImage(null);
                      }}
                      className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        selectedImagePreset === p.url && !newItemImage ? 'border-primary scale-[1.03]' : 'border-transparent opacity-70'
                      }`}
                    >
                      <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center">
                        <p className="text-[9px] text-white truncate px-1">{p.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    resetAddItemForm();
                    setIsAddModalOpen(false);
                  }}
                  className="flex-1 py-4 border border-outline-variant rounded-xl font-display font-semibold text-xs text-on-surface-variant hover:bg-surface-container-low active:scale-95 transition-all cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-primary text-white rounded-xl font-display font-semibold text-xs shadow-lg shadow-primary/10 hover:bg-primary-container active:scale-95 transition-all cursor-pointer"
                >
                  {t('addToCloset')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: AI Mix & Match Curation */}
      {isMixMatchOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#f8f9fc] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/30 max-h-[90vh] flex flex-col animate-fade-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-white/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined filled text-primary animate-spin">smart_toy</span>
                <h3 className="font-display font-extrabold text-primary text-lg">{t('aiSmartMixMatch')}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMixMatchOpen(false);
                  setGeneratedOutfit(null);
                }}
                className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-[#191c1e] hover:bg-surface-container transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Scrollable Curation Interface */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {!generatedOutfit && !isGenerating ? (
                <div className="space-y-6 text-center py-6">
                  <p className="text-sm font-medium text-on-surface-variant leading-relaxed">
                    {t('mixMatchDesc')}
                  </p>
                  
                  {/* Scenario selection */}
                  <div className="flex p-1 bg-surface-container rounded-2xl w-full max-w-xs mx-auto">
                    {(['Commute', 'Date', 'Casual'] as const).map((scen) => (
                      <button
                        key={scen}
                        type="button"
                        onClick={() => setSelectedScenario(scen)}
                        className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${
                          selectedScenario === scen
                            ? 'bg-primary text-white shadow-md'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        {t(scen.toLowerCase() as 'commute' | 'date' | 'casual')}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleMixAndMatch}
                    className="w-full py-4 mt-6 bg-primary text-white rounded-xl font-display font-bold text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:bg-primary-container active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-white text-base">auto_awesome</span>
                    {t('generateLook')}
                  </button>
                </div>
              ) : isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <span className="absolute inset-0 flex items-center justify-center material-symbols-outlined text-primary text-2xl animate-pulse">
                      smart_toy
                    </span>
                  </div>
                  <div className="text-center space-y-1">
                    <h4 className="font-display font-bold text-primary">{t('atelierStylingIntelligence')}</h4>
                    <p className="text-xs text-on-surface-variant animate-pulse font-medium">
                      {t('harmonizing', { scenario: selectedScenario })}
                    </p>
                  </div>
                </div>
              ) : (
                generatedOutfit && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Visual Card */}
                    <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-surface-container shadow-md">
                      <img src={generatedOutfit.image} alt="Curation mockup" className="w-full h-full object-cover" />
                      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">
                        {generatedOutfit.tempPerfect}
                      </div>
                    </div>

                    {/* Headline */}
                    <div>
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                        {t('perfectMatch', { scenario: selectedScenario })}
                      </span>
                      <h4 className="font-display text-2xl font-extrabold text-primary mt-1">
                        {generatedOutfit.name}
                      </h4>
                    </div>

                    {/* Notes grid */}
                    <div className="space-y-4">
                      {generatedOutfit.curationNotes.map((note, idx) => (
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

                    {/* Matched closet items */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-outline mb-3">
                        {t('selectedWardrobeCoordinates')}
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        {generatedOutfit.items?.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              onViewItem(item);
                              setIsMixMatchOpen(false);
                            }}
                            className="bg-surface-container-low rounded-2xl p-3 flex flex-col gap-2 cursor-pointer hover:shadow-md transition-all"
                          >
                            <div className="aspect-square rounded-xl overflow-hidden bg-white">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#191c1e] truncate">{item.name}</p>
                              <p className="text-[10px] text-on-surface-variant font-medium">{item.brand}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Bottom Actions */}
            {generatedOutfit && (
              <div className="p-6 border-t border-outline-variant/30 flex gap-4 bg-white/40">
                <button
                  type="button"
                  onClick={() => {
                    setIsMixMatchOpen(false);
                    setGeneratedOutfit(null);
                  }}
                  className="flex-1 py-4 border border-outline-variant rounded-full font-display font-semibold text-sm hover:bg-surface-container-low active:scale-95 transition-all cursor-pointer text-center"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert(t('saveFavoriteLookSuccess'));
                    setIsMixMatchOpen(false);
                    setGeneratedOutfit(null);
                  }}
                  className="flex-1 py-4 bg-primary text-white rounded-full font-display font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-lg shadow-primary/10"
                >
                  <span className="material-symbols-outlined text-white text-base">bookmark</span>
                  {t('saveFavoriteLook')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
