import React, { useEffect, useState } from 'react';
import { getInitialItems, getInitialUser } from './data';
import { Item, UserProfile } from './types';
import { I18nProvider, LanguageSwitcher, useTranslation } from './i18n';
import AuthScreen from './components/AuthScreen';
import HomeTab from './components/HomeTab';
import ClosetTab from './components/ClosetTab';
import ScannerTab from './components/ScannerTab';
import OutfitGeneratorTab from './components/OutfitGeneratorTab';
import ProductDetail from './components/ProductDetail';

const AUTH_TOKEN_KEY = 'wearmate_auth_token';

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

function AppContent() {
  const { t, language } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState<UserProfile>(getInitialUser(language));
  const [items, setItems] = useState<Item[]>(getInitialItems(language));
  const [activeTab, setActiveTab] = useState<'home' | 'closet' | 'scan' | 'outfit'>('home');
  const [viewingItem, setViewingItem] = useState<Item | null>(null);

  const loadUserItems = async (token: string, userId?: string) => {
    try {
      const res = await fetch('/api/items', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        setItems(data.items);
      } else {
        // First login: seed with localized initial items and persist them
        const initialItems = getInitialItems(language).map((it) => ({
          ...it,
          id: it.id.startsWith('init-') ? `${it.id}-${userId || Date.now()}` : it.id,
        }));
        setItems(initialItems);
        await Promise.all(
          initialItems.map((item) =>
            fetch('/api/items', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ item }),
            })
          )
        );
      }
    } catch (err) {
      console.error('Failed to load user items:', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setIsAuthLoading(false);
      return;
    }

    fetch('/api/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (data.user) {
          setUser(data.user);
          setIsLoggedIn(true);
          await loadUserItems(token, data.user.id);
        } else {
          localStorage.removeItem(AUTH_TOKEN_KEY);
        }
      })
      .catch(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      })
      .finally(() => {
        setIsAuthLoading(false);
      });
  }, []);

  const handleLogin = async (authenticatedUser: UserProfile, token: string) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setUser(authenticatedUser);
    setIsLoggedIn(true);
    await loadUserItems(token, authenticatedUser.id);
  };

  const handleLogout = async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      try {
        await fetch('/api/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error('Logout request failed:', err);
      }
    }
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setIsLoggedIn(false);
    setUser(getInitialUser(language));
    setItems(getInitialItems(language));
  };

  const handleAddItem = async (newItem: Item) => {
    setItems((prev) => [newItem, ...prev]);
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return;
    try {
      await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ item: newItem }),
      });
    } catch (err) {
      console.error('Failed to save item:', err);
    }
  };

  const handleToggleFavorite = async (itemId: string) => {
    const currentItem = items.find((it) => it.id === itemId);
    if (!currentItem) return;
    const updatedItem = { ...currentItem, isFavorite: !currentItem.isFavorite };

    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? updatedItem : it))
    );
    // Update currently viewed item if applicable
    if (viewingItem && viewingItem.id === itemId) {
      setViewingItem(updatedItem);
    }

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return;
    try {
      await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ item: updatedItem }),
      });
    } catch (err) {
      console.error('Failed to update item favorite:', err);
    }
  };

  const handleUpdateUserProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="relative min-h-screen bg-[#f8f9fc] text-[#191c1e] font-sans pb-28">
      {/* Background Ambient Blur Blobs */}
      <div className="fixed -top-[10%] -right-[10%] w-[500px] h-[500px] bg-[#121367]/5 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="fixed -bottom-[10%] -left-[10%] w-[400px] h-[400px] bg-[#ffdbcf]/15 rounded-full blur-[100px] z-0 pointer-events-none" />

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-[#f8f9fc]/85 backdrop-blur-md border-b border-outline-variant/30">
        <div className="max-w-xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-extrabold tracking-tighter text-primary">
              {t('appName')}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-all cursor-pointer"
              title={t('logout')}
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-xl mx-auto px-6 py-8 relative z-10">
        {viewingItem ? (
          <ProductDetail
            item={viewingItem}
            closetItems={items}
            user={user}
            onBack={() => setViewingItem(null)}
            onToggleFavorite={handleToggleFavorite}
            onSelectRelatedItem={(it) => setViewingItem(it)}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeTab
                user={user}
                onNavigateToScan={() => setActiveTab('scan')}
                onViewItem={(it) => setViewingItem(it)}
              />
            )}
            {activeTab === 'closet' && (
              <ClosetTab
                items={items}
                user={user}
                onAddItem={handleAddItem}
                onViewItem={(it) => setViewingItem(it)}
              />
            )}
            {activeTab === 'scan' && (
              <ScannerTab
                user={user}
                onUpdateUserProfile={handleUpdateUserProfile}
                onAddItem={handleAddItem}
              />
            )}
            {activeTab === 'outfit' && (
              <OutfitGeneratorTab user={user} items={items} />
            )}
          </>
        )}
      </main>

      {/* Bottom Sticky Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-md border-t border-outline-variant/30 py-3.5 px-6 z-40 flex justify-around items-center max-w-xl mx-auto rounded-t-3xl shadow-lg shadow-black/5">
        <button
          type="button"
          onClick={() => {
            setViewingItem(null);
            setActiveTab('home');
          }}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'home' && !viewingItem ? 'text-primary scale-105' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className={`material-symbols-outlined text-2xl ${activeTab === 'home' && !viewingItem ? 'filled text-primary' : 'text-[#626374]'}`}>
            home
          </span>
          <span className={`text-[10px] font-bold tracking-wide ${activeTab === 'home' && !viewingItem ? 'text-primary' : 'text-[#626374]'}`}>{t('home')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setViewingItem(null);
            setActiveTab('closet');
          }}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'closet' && !viewingItem ? 'text-primary scale-105' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className={`material-symbols-outlined text-2xl ${activeTab === 'closet' && !viewingItem ? 'filled text-primary' : 'text-[#626374]'}`}>
            checkroom
          </span>
          <span className={`text-[10px] font-bold tracking-wide ${activeTab === 'closet' && !viewingItem ? 'text-primary' : 'text-[#626374]'}`}>{t('closet')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setViewingItem(null);
            setActiveTab('scan');
          }}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'scan' && !viewingItem ? 'text-primary scale-105' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className={`material-symbols-outlined text-2xl ${activeTab === 'scan' && !viewingItem ? 'filled text-primary' : 'text-[#626374]'}`}>
            document_scanner
          </span>
          <span className={`text-[10px] font-bold tracking-wide ${activeTab === 'scan' && !viewingItem ? 'text-primary' : 'text-[#626374]'}`}>{t('aiScan')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setViewingItem(null);
            setActiveTab('outfit');
          }}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'outfit' && !viewingItem ? 'text-primary scale-105' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className={`material-symbols-outlined text-2xl ${activeTab === 'outfit' && !viewingItem ? 'filled text-primary' : 'text-[#626374]'}`}>
            auto_awesome
          </span>
          <span className={`text-[10px] font-bold tracking-wide ${activeTab === 'outfit' && !viewingItem ? 'text-primary' : 'text-[#626374]'}`}>{t('outfitGenerator')}</span>
        </button>
      </nav>
    </div>
  );
}
