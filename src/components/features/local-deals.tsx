'use client';

/**
 * [STABILITY_ANCHOR: LOCAL_DEALS_V1.0]
 * عروض المحلات القريبة — مقارنة أسعار + بحث + تأكيد/إبلاغ
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, MapPin, Plus, Trophy, Clock, AlertTriangle, ChevronDown,
  ThumbsUp, Flag, Store as StoreIcon, Tag, ArrowDownAZ, X,
  Loader2, Package, ShoppingCart, TrendingDown, ChevronRight, Percent
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/auth-provider';
import { cn } from '@/lib/utils';
import {
  Deal, Store, DealCategory, DEAL_CATEGORIES,
  getDeals, getStores, searchDealsByProduct, searchStoresByName,
  addDeal, addStore, confirmDeal, reportDeal, getDealsByStore,
  seedDealsData, getDistanceKm
} from '@/lib/deals-store';

type SortMode = 'price' | 'discount' | 'confirmations' | 'newest';
type ViewMode = 'browse' | 'product-results' | 'store-view';

export function LocalDeals() {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DealCategory | 'all'>('all');
  const [sortMode, setSortMode] = useState<SortMode>('price');
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [storeDeals, setStoreDeals] = useState<Deal[]>([]);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Add Deal Form
  const [newProductName, setNewProductName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newOriginalPrice, setNewOriginalPrice] = useState('');
  const [newCategory, setNewCategory] = useState<DealCategory>('groceries');
  const [newUnit, setNewUnit] = useState('');
  const [newStoreId, setNewStoreId] = useState('');
  const [newExpiresInDays, setNewExpiresInDays] = useState('');
  const [addingDeal, setAddingDeal] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedDeals, fetchedStores] = await Promise.all([getDeals(), getStores()]);
      setDeals(fetchedDeals);
      setStores(fetchedStores);
    } catch (err) {
      console.error('Error loading deals:', err);
    } finally {
      setLoading(false);
    }
  };

  // Search handler
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setViewMode('browse');
      setActiveSearch('');
      return;
    }
    setLoading(true);
    setActiveSearch(searchQuery.trim());
    try {
      // Check if searching for a store name
      const matchingStores = await searchStoresByName(searchQuery.trim());
      if (matchingStores.length === 1) {
        // Exact store match → show store view
        handleViewStore(matchingStores[0]);
        setLoading(false);
        return;
      }
      // Search for product
      const results = await searchDealsByProduct(searchQuery.trim());
      setDeals(results);
      setViewMode('product-results');
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // View Store
  const handleViewStore = async (store: Store) => {
    setSelectedStore(store);
    setViewMode('store-view');
    setLoading(true);
    try {
      const sd = await getDealsByStore(store.id);
      setStoreDeals(sd);
    } catch (err) {
      console.error('Error loading store deals:', err);
    } finally {
      setLoading(false);
    }
  };

  // Back to browse
  const handleBack = () => {
    setViewMode('browse');
    setSelectedStore(null);
    setActiveSearch('');
    setSearchQuery('');
    loadData();
  };

  // Filter & Sort deals
  const filteredDeals = useMemo(() => {
    let list = viewMode === 'store-view' ? storeDeals : deals;
    if (categoryFilter !== 'all') {
      list = list.filter(d => d.category === categoryFilter);
    }
    const sorted = [...list];
    switch (sortMode) {
      case 'price': sorted.sort((a, b) => a.price - b.price); break;
      case 'discount': sorted.sort((a, b) => {
        const discA = a.originalPrice ? ((a.originalPrice - a.price) / a.originalPrice) * 100 : 0;
        const discB = b.originalPrice ? ((b.originalPrice - b.price) / b.originalPrice) * 100 : 0;
        return discB - discA;
      }); break;
      case 'confirmations': sorted.sort((a, b) => b.confirmations - a.confirmations); break;
      case 'newest': sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    }
    return sorted;
  }, [deals, storeDeals, categoryFilter, sortMode, viewMode]);

  // Group deals by product name (for product search results)
  const groupedByProduct = useMemo(() => {
    if (viewMode !== 'product-results') return {};
    const groups: Record<string, Deal[]> = {};
    filteredDeals.forEach(deal => {
      const key = deal.productName;
      if (!groups[key]) groups[key] = [];
      groups[key].push(deal);
    });
    // Sort within each group by price
    Object.values(groups).forEach(g => g.sort((a, b) => a.price - b.price));
    return groups;
  }, [filteredDeals, viewMode]);

  // Confirm
  const handleConfirm = async (dealId: string) => {
    if (!user) return;
    await confirmDeal(dealId, user.id);
    toast({ title: '✅ تم التأكيد', description: 'شكراً لتأكيد السعر!' });
    // Update local
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, confirmations: d.confirmations + 1, confirmedBy: [...d.confirmedBy, user.id] } : d));
    setStoreDeals(prev => prev.map(d => d.id === dealId ? { ...d, confirmations: d.confirmations + 1, confirmedBy: [...d.confirmedBy, user.id] } : d));
  };

  // Report
  const handleReport = async (dealId: string) => {
    if (!user) return;
    await reportDeal(dealId, user.id);
    toast({ title: '🚩 تم الإبلاغ', description: 'شكراً لإبلاغك — هنراجع السعر.' });
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, reports: d.reports + 1, reportedBy: [...d.reportedBy, user.id] } : d));
    setStoreDeals(prev => prev.map(d => d.id === dealId ? { ...d, reports: d.reports + 1, reportedBy: [...d.reportedBy, user.id] } : d));
  };

  // Add Deal
  const handleAddDeal = async () => {
    if (!user || !newProductName.trim() || !newPrice || !newStoreId) return;
    setAddingDeal(true);
    try {
      const store = stores.find(s => s.id === newStoreId);
      if (!store) return;
      await addDeal({
        storeId: newStoreId,
        storeName: store.name,
        productName: newProductName.trim(),
        price: parseFloat(newPrice),
        originalPrice: newOriginalPrice ? parseFloat(newOriginalPrice) : undefined,
        category: newCategory,
        unit: newUnit.trim() || undefined,
        addedBy: user.id,
        addedByName: user.name || user.username,
        createdAt: new Date().toISOString(),
        expiresAt: newExpiresInDays ? new Date(Date.now() + parseInt(newExpiresInDays) * 24 * 60 * 60 * 1000).toISOString() : undefined,
      });
      toast({ title: '✅ تم إضافة العرض', description: `${newProductName} في ${store.name}` });
      setShowAddDeal(false);
      setNewProductName(''); setNewPrice(''); setNewOriginalPrice('');
      setNewUnit(''); setNewStoreId(''); setNewExpiresInDays('');
      loadData();
    } catch (err) {
      toast({ title: '❌ خطأ', description: 'حدث خطأ أثناء الإضافة', variant: 'destructive' });
    } finally {
      setAddingDeal(false);
    }
  };

  // Seed data
  const handleSeed = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      await seedDealsData(user.id, user.name || user.username);
      toast({ title: '✅ تم تحميل البيانات التجريبية' });
      loadData();
    } catch (err) {
      toast({ title: '❌ خطأ', variant: 'destructive' });
    } finally {
      setSeeding(false);
    }
  };

  // Helper: is deal expiring soon (< 24h)
  const isExpiringSoon = (deal: Deal): boolean => {
    if (!deal.expiresAt) return false;
    const timeLeft = new Date(deal.expiresAt).getTime() - Date.now();
    return timeLeft > 0 && timeLeft < 24 * 60 * 60 * 1000;
  };

  const isExpired = (deal: Deal): boolean => {
    if (!deal.expiresAt) return false;
    return new Date(deal.expiresAt).getTime() < Date.now();
  };

  const getDiscount = (deal: Deal): number | null => {
    if (!deal.originalPrice || deal.originalPrice <= deal.price) return null;
    return Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100);
  };

  // ─── Deal Card ─────────────────────────────────────────────────
  const DealCard = ({ deal, showStore = true, isCheapest = false }: { deal: Deal; showStore?: boolean; isCheapest?: boolean }) => {
    const discount = getDiscount(deal);
    const expiringSoon = isExpiringSoon(deal);
    const expired = isExpired(deal);
    const alreadyConfirmed = user ? deal.confirmedBy?.includes(user.id) : false;
    const alreadyReported = user ? deal.reportedBy?.includes(user.id) : false;
    const categoryInfo = DEAL_CATEGORIES.find(c => c.id === deal.category);

    if (expired) return null;

    return (
      <div className={cn(
        "group relative p-4 rounded-2xl border transition-all hover:shadow-lg",
        isCheapest
          ? "bg-emerald-500/5 border-emerald-500/20 ring-1 ring-emerald-500/10"
          : "bg-white/[0.02] border-white/5 hover:border-white/10"
      )}>
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {isCheapest && (
            <Badge className="bg-emerald-500/90 text-white text-[10px] font-black px-2 py-0.5 gap-1 rounded-lg">
              <Trophy className="size-3" /> الأرخص
            </Badge>
          )}
          {expiringSoon && (
            <Badge className="bg-red-500/90 text-white text-[10px] font-black px-2 py-0.5 gap-1 rounded-lg animate-pulse">
              <Clock className="size-3" /> ينتهي قريباً
            </Badge>
          )}
          {discount && (
            <Badge className="bg-amber-500/90 text-white text-[10px] font-black px-2 py-0.5 gap-1 rounded-lg">
              <TrendingDown className="size-3" /> {discount}%−
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-3 text-right">
          {/* Product Name + Category */}
          <div className="flex items-start justify-between gap-3 flex-row-reverse pt-1">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base text-white truncate">{deal.productName}</h3>
              <div className="flex items-center gap-2 flex-row-reverse mt-1">
                {showStore && (
                  <button
                    onClick={() => {
                      const store = stores.find(s => s.id === deal.storeId);
                      if (store) handleViewStore(store);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 flex-row-reverse"
                  >
                    <StoreIcon className="size-3" />
                    {deal.storeName}
                  </button>
                )}
                <span className="text-[10px] text-muted-foreground">{categoryInfo?.emoji} {categoryInfo?.label}</span>
                {deal.unit && <span className="text-[10px] text-muted-foreground bg-white/5 px-1.5 rounded">{deal.unit}</span>}
              </div>
            </div>

            {/* Price */}
            <div className="text-left shrink-0">
              <span className={cn("text-2xl font-black", isCheapest ? "text-emerald-400" : "text-white")}>{deal.price}</span>
              <span className="text-xs text-muted-foreground mr-1">ج.م</span>
              {deal.originalPrice && (
                <div className="text-xs text-muted-foreground line-through">{deal.originalPrice} ج.م</div>
              )}
            </div>
          </div>

          {/* Footer: Confirmations + Actions */}
          <div className="flex items-center justify-between border-t border-white/5 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => !alreadyConfirmed && handleConfirm(deal.id)}
                disabled={alreadyConfirmed}
                className={cn(
                  "flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors",
                  alreadyConfirmed
                    ? "bg-emerald-500/10 text-emerald-400 cursor-default"
                    : "bg-white/5 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400"
                )}
              >
                <ThumbsUp className="size-3" />
                {deal.confirmations > 0 && <span>{deal.confirmations}</span>}
                {alreadyConfirmed ? 'تم التأكيد' : 'تأكيد'}
              </button>
              <button
                onClick={() => !alreadyReported && handleReport(deal.id)}
                disabled={alreadyReported}
                className={cn(
                  "flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors",
                  alreadyReported
                    ? "bg-red-500/10 text-red-400 cursor-default"
                    : "bg-white/5 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                )}
              >
                <Flag className="size-3" />
                {alreadyReported ? 'تم الإبلاغ' : 'إبلاغ'}
              </button>
            </div>
            <span className="text-[10px] text-muted-foreground">
              أضاف {deal.addedByName} · {new Date(deal.createdAt).toLocaleDateString('ar-EG')}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full p-4 sm:p-6 max-w-4xl mx-auto w-full animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-row-reverse">
        <div className="flex items-center gap-3 flex-row-reverse">
          {viewMode !== 'browse' && (
            <Button variant="ghost" size="sm" onClick={handleBack} className="text-xs text-muted-foreground gap-1">
              <ChevronRight className="size-3" /> رجوع
            </Button>
          )}
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2 flex-row-reverse">
              <Tag className="size-5 text-amber-400" />
              {viewMode === 'store-view' ? selectedStore?.name : 'عروض المحلات'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {viewMode === 'store-view'
                ? `${selectedStore?.type} · ${selectedStore?.address}`
                : viewMode === 'product-results'
                  ? `نتائج البحث عن "${activeSearch}" — ${filteredDeals.length} عرض`
                  : 'قارن الأسعار واعرف مين أرخص'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Seed Button */}
          {deals.length === 0 && !loading && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={seeding}
              className="text-xs h-9 rounded-xl border-amber-500/20 text-amber-400 hover:bg-amber-500/10 gap-1"
            >
              {seeding ? <Loader2 className="size-3 animate-spin" /> : <Package className="size-3" />}
              تحميل بيانات تجريبية
            </Button>
          )}

          {/* Add Deal Button */}
          <Dialog open={showAddDeal} onOpenChange={setShowAddDeal}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 bg-primary rounded-xl gap-1 text-xs font-bold">
                <Plus className="size-3.5" /> أضف عرض
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-950 border-white/10 rounded-[2rem] sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-right">إضافة عرض جديد</DialogTitle>
                <DialogDescription className="text-right">أضف سعر شفته في محل قريب.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Store Selection */}
                <div className="space-y-2 text-right">
                  <Label>المحل</Label>
                  <Select value={newStoreId} onValueChange={setNewStoreId}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-right h-11 rounded-xl">
                      <SelectValue placeholder="اختر المحل..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-white/10">
                      {stores.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name} — {s.type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Product Name */}
                <div className="space-y-2 text-right">
                  <Label>اسم المنتج</Label>
                  <Input value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="مثال: أرز مصري 5 كجم" className="bg-white/5 border-white/10 h-11 rounded-xl text-right" />
                </div>

                {/* Price Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2 text-right">
                    <Label>السعر (ج.م)</Label>
                    <Input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="42" className="bg-white/5 border-white/10 h-11 rounded-xl text-right" />
                  </div>
                  <div className="space-y-2 text-right">
                    <Label>السعر قبل الخصم (اختياري)</Label>
                    <Input type="number" value={newOriginalPrice} onChange={e => setNewOriginalPrice(e.target.value)} placeholder="55" className="bg-white/5 border-white/10 h-11 rounded-xl text-right" />
                  </div>
                </div>

                {/* Category + Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2 text-right">
                    <Label>الفئة</Label>
                    <Select value={newCategory} onValueChange={v => setNewCategory(v as DealCategory)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-right h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-white/10">
                        {DEAL_CATEGORIES.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.emoji} {c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 text-right">
                    <Label>الوحدة (اختياري)</Label>
                    <Input value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="1 كجم / 1 لتر" className="bg-white/5 border-white/10 h-11 rounded-xl text-right" />
                  </div>
                </div>

                {/* Expires */}
                <div className="space-y-2 text-right">
                  <Label>ينتهي خلال (اختياري)</Label>
                  <Select value={newExpiresInDays} onValueChange={setNewExpiresInDays}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-right h-11 rounded-xl">
                      <SelectValue placeholder="بدون تاريخ انتهاء" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-white/10">
                      <SelectItem value="1">يوم واحد</SelectItem>
                      <SelectItem value="3">3 أيام</SelectItem>
                      <SelectItem value="7">أسبوع</SelectItem>
                      <SelectItem value="14">أسبوعين</SelectItem>
                      <SelectItem value="30">شهر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleAddDeal}
                  disabled={addingDeal || !newProductName || !newPrice || !newStoreId}
                  className="w-full h-11 bg-primary rounded-xl font-bold"
                >
                  {addingDeal ? <Loader2 className="size-4 animate-spin" /> : 'إضافة العرض'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search Bar */}
      {viewMode !== 'store-view' && (
        <div className="relative mb-5">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="ابحث عن منتج (أرز، زيت، سكر...) أو اسم محل..."
            className="bg-white/5 border-white/10 h-12 rounded-2xl pr-11 pl-20 text-right text-base"
          />
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-1">
            {activeSearch && (
              <Button variant="ghost" size="icon" className="size-8" onClick={handleBack}>
                <X className="size-3.5" />
              </Button>
            )}
            <Button size="sm" onClick={handleSearch} className="h-8 rounded-xl text-xs bg-primary px-4">
              بحث
            </Button>
          </div>
        </div>
      )}

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-thin">
        <button
          onClick={() => setCategoryFilter('all')}
          className={cn(
            "shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors",
            categoryFilter === 'all'
              ? "bg-primary text-white"
              : "bg-white/5 text-muted-foreground hover:bg-white/10"
          )}
        >
          الكل
        </button>
        {DEAL_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={cn(
              "shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap",
              categoryFilter === cat.id
                ? "bg-primary text-white"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            )}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2 mb-5 flex-row-reverse text-xs text-muted-foreground">
        <ArrowDownAZ className="size-3.5" />
        <span className="font-bold">ترتيب:</span>
        {[
          { id: 'price' as SortMode, label: 'السعر الأقل' },
          { id: 'discount' as SortMode, label: 'أكبر خصم' },
          { id: 'confirmations' as SortMode, label: 'الأكثر تأكيداً' },
          { id: 'newest' as SortMode, label: 'الأحدث' },
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => setSortMode(opt.id)}
            className={cn(
              "px-2.5 py-1.5 rounded-lg transition-colors",
              sortMode === opt.id
                ? "bg-white/10 text-white font-bold"
                : "hover:bg-white/5"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ─── Content ─── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filteredDeals.length === 0 ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-16">
          <div className="size-20 rounded-3xl bg-white/5 flex items-center justify-center">
            <ShoppingCart className="size-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {activeSearch ? `لا توجد نتائج لـ "${activeSearch}"` : 'لا توجد عروض بعد'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            {activeSearch
              ? 'كن أول من يضيف هذا المنتج!'
              : 'ابدأ بإضافة أول عرض شفته أو حمّل البيانات التجريبية.'
            }
          </p>
          <div className="flex gap-3">
            <Button onClick={() => setShowAddDeal(true)} className="rounded-xl gap-1.5 bg-primary">
              <Plus className="size-4" /> أضف أول عرض
            </Button>
            {!activeSearch && (
              <Button onClick={handleSeed} variant="outline" disabled={seeding} className="rounded-xl gap-1.5 border-white/10">
                {seeding ? <Loader2 className="size-4 animate-spin" /> : <Package className="size-4" />} بيانات تجريبية
              </Button>
            )}
          </div>
        </div>
      ) : viewMode === 'product-results' ? (
        /* Product Search Results — Grouped */
        <div className="flex-1 overflow-y-auto space-y-6">
          {Object.entries(groupedByProduct).map(([productName, productDeals]) => (
            <div key={productName} className="space-y-3">
              <div className="flex items-center gap-3 flex-row-reverse">
                <h2 className="text-sm font-black text-white flex items-center gap-2 flex-row-reverse">
                  {DEAL_CATEGORIES.find(c => c.id === productDeals[0].category)?.emoji}
                  {productName}
                </h2>
                <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">{productDeals.length} محل</Badge>
              </div>
              <div className="space-y-2.5">
                {productDeals.map((deal, i) => (
                  <DealCard key={deal.id} deal={deal} isCheapest={i === 0} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Browse / Store View — List */
        <div className="flex-1 overflow-y-auto space-y-3">
          {/* Store Header (in store view) */}
          {viewMode === 'store-view' && selectedStore && (
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-4 flex-row-reverse mb-4">
              <div className="size-14 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                <StoreIcon className="size-7 text-indigo-400" />
              </div>
              <div className="flex-1 text-right">
                <h2 className="font-bold text-lg text-white">{selectedStore.name}</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1 flex-row-reverse mt-0.5">
                  <MapPin className="size-3" /> {selectedStore.address}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedStore.type} · {selectedStore.dealsCount} عرض</p>
              </div>
            </div>
          )}

          {filteredDeals.map((deal, i) => (
            <DealCard key={deal.id} deal={deal} showStore={viewMode !== 'store-view'} isCheapest={sortMode === 'price' && i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
