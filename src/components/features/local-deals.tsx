'use client';

/**
 * [STABILITY_ANCHOR: LOCAL_DEALS_V2.0]
 * عروض المحلات القريبة — تصميم احترافي مع مقارنة أسعار.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, MapPin, Plus, Trophy, Clock, ThumbsUp, Flag,
  Store as StoreIcon, Tag, X, Loader2, Package, ShoppingCart,
  TrendingDown, ChevronRight, Sparkles, ArrowUpDown, BadgePercent
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
  addDeal, confirmDeal, reportDeal, getDealsByStore, seedDealsData
} from '@/lib/deals-store';

type SortMode = 'price' | 'discount' | 'confirmations' | 'newest';
type ViewMode = 'browse' | 'product-results' | 'store-view';

export function LocalDeals() {
  const { user } = useAuth();
  const { toast } = useToast();
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
  const [newProductName, setNewProductName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newOriginalPrice, setNewOriginalPrice] = useState('');
  const [newCategory, setNewCategory] = useState<DealCategory>('groceries');
  const [newUnit, setNewUnit] = useState('');
  const [newStoreId, setNewStoreId] = useState('');
  const [newExpiresInDays, setNewExpiresInDays] = useState('');
  const [addingDeal, setAddingDeal] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [d, s] = await Promise.all([getDeals(), getStores()]);
      setDeals(d); setStores(s);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setViewMode('browse'); setActiveSearch(''); return; }
    setLoading(true); setActiveSearch(searchQuery.trim());
    try {
      const matchingStores = await searchStoresByName(searchQuery.trim());
      if (matchingStores.length === 1) { handleViewStore(matchingStores[0]); setLoading(false); return; }
      const results = await searchDealsByProduct(searchQuery.trim());
      setDeals(results); setViewMode('product-results');
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleViewStore = async (store: Store) => {
    setSelectedStore(store); setViewMode('store-view'); setLoading(true);
    try { setStoreDeals(await getDealsByStore(store.id)); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleBack = () => { setViewMode('browse'); setSelectedStore(null); setActiveSearch(''); setSearchQuery(''); loadData(); };

  const filteredDeals = useMemo(() => {
    let list = viewMode === 'store-view' ? storeDeals : deals;
    if (categoryFilter !== 'all') list = list.filter(d => d.category === categoryFilter);
    const sorted = [...list];
    switch (sortMode) {
      case 'price': sorted.sort((a, b) => a.price - b.price); break;
      case 'discount': sorted.sort((a, b) => {
        const da = a.originalPrice ? ((a.originalPrice - a.price) / a.originalPrice) * 100 : 0;
        const db = b.originalPrice ? ((b.originalPrice - b.price) / b.originalPrice) * 100 : 0;
        return db - da;
      }); break;
      case 'confirmations': sorted.sort((a, b) => b.confirmations - a.confirmations); break;
      case 'newest': sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    }
    return sorted;
  }, [deals, storeDeals, categoryFilter, sortMode, viewMode]);

  const groupedByProduct = useMemo(() => {
    if (viewMode !== 'product-results') return {};
    const groups: Record<string, Deal[]> = {};
    filteredDeals.forEach(d => { if (!groups[d.productName]) groups[d.productName] = []; groups[d.productName].push(d); });
    Object.values(groups).forEach(g => g.sort((a, b) => a.price - b.price));
    return groups;
  }, [filteredDeals, viewMode]);

  const handleConfirm = async (dealId: string) => {
    if (!user) return;
    await confirmDeal(dealId, user.id);
    toast({ title: '✅ تم التأكيد', description: 'شكراً لتأكيد السعر!' });
    const update = (prev: Deal[]) => prev.map(d => d.id === dealId ? { ...d, confirmations: d.confirmations + 1, confirmedBy: [...d.confirmedBy, user.id] } : d);
    setDeals(update); setStoreDeals(update);
  };

  const handleReport = async (dealId: string) => {
    if (!user) return;
    await reportDeal(dealId, user.id);
    toast({ title: '🚩 تم الإبلاغ', description: 'شكراً — هنراجع السعر.' });
    const update = (prev: Deal[]) => prev.map(d => d.id === dealId ? { ...d, reports: d.reports + 1, reportedBy: [...d.reportedBy, user.id] } : d);
    setDeals(update); setStoreDeals(update);
  };

  const handleAddDeal = async () => {
    if (!user || !newProductName.trim() || !newPrice || !newStoreId) return;
    setAddingDeal(true);
    try {
      const store = stores.find(s => s.id === newStoreId);
      if (!store) return;
      await addDeal({
        storeId: newStoreId, storeName: store.name, productName: newProductName.trim(),
        price: parseFloat(newPrice), originalPrice: newOriginalPrice ? parseFloat(newOriginalPrice) : undefined,
        category: newCategory, unit: newUnit.trim() || undefined,
        addedBy: user.id, addedByName: user.name || user.username,
        createdAt: new Date().toISOString(),
        expiresAt: newExpiresInDays ? new Date(Date.now() + parseInt(newExpiresInDays) * 86400000).toISOString() : undefined,
      });
      toast({ title: '✅ تم الإضافة', description: `${newProductName} في ${store.name}` });
      setShowAddDeal(false); setNewProductName(''); setNewPrice(''); setNewOriginalPrice(''); setNewUnit(''); setNewStoreId(''); setNewExpiresInDays('');
      loadData();
    } catch { toast({ title: '❌ خطأ', variant: 'destructive' }); }
    finally { setAddingDeal(false); }
  };

  const handleSeed = async () => {
    if (!user) return; setSeeding(true);
    try { await seedDealsData(user.id, user.name || user.username); toast({ title: '✅ تم تحميل البيانات' }); loadData(); }
    catch { toast({ title: '❌ خطأ', variant: 'destructive' }); }
    finally { setSeeding(false); }
  };

  const isExpiringSoon = (d: Deal) => d.expiresAt ? (new Date(d.expiresAt).getTime() - Date.now()) > 0 && (new Date(d.expiresAt).getTime() - Date.now()) < 86400000 : false;
  const isExpired = (d: Deal) => d.expiresAt ? new Date(d.expiresAt).getTime() < Date.now() : false;
  const getDiscount = (d: Deal) => d.originalPrice && d.originalPrice > d.price ? Math.round(((d.originalPrice - d.price) / d.originalPrice) * 100) : null;

  // ─── Deal Card ──────────────────────────────────────────
  const DealCard = ({ deal, showStore = true, isCheapest = false, rank }: { deal: Deal; showStore?: boolean; isCheapest?: boolean; rank?: number }) => {
    const discount = getDiscount(deal);
    const expiring = isExpiringSoon(deal);
    const alreadyConfirmed = user ? deal.confirmedBy?.includes(user.id) : false;
    const alreadyReported = user ? deal.reportedBy?.includes(user.id) : false;
    const cat = DEAL_CATEGORIES.find(c => c.id === deal.category);
    if (isExpired(deal)) return null;

    return (
      <div className={cn(
        "group relative rounded-2xl transition-all duration-300 hover:scale-[1.01]",
        isCheapest
          ? "bg-gradient-to-l from-emerald-500/[0.08] to-emerald-500/[0.02] border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.06)]"
          : "bg-white/[0.03] border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.05]"
      )}>
        <div className="p-4 flex items-center gap-4 flex-row-reverse">

          {/* Rank / Store Avatar */}
          <div className={cn(
            "size-12 rounded-xl flex items-center justify-center shrink-0 font-black text-lg",
            isCheapest
              ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/20"
              : rank && rank <= 3
                ? "bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-300 border border-indigo-500/20"
                : "bg-white/[0.05] text-slate-500 border border-white/5"
          )}>
            {isCheapest ? <Trophy className="size-5" /> : rank ? `#${rank}` : <StoreIcon className="size-5" />}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-right">
            <h3 className="font-bold text-[15px] text-white truncate leading-tight">{deal.productName}</h3>
            <div className="flex items-center gap-2 flex-row-reverse mt-1.5 flex-wrap">
              {showStore && (
                <button
                  onClick={() => { const s = stores.find(s => s.id === deal.storeId); if (s) handleViewStore(s); }}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 flex-row-reverse transition-colors"
                >
                  <StoreIcon className="size-3" /> {deal.storeName}
                </button>
              )}
              <span className="text-[10px] text-slate-500 flex items-center gap-1 flex-row-reverse">
                {cat?.emoji} {cat?.label}
              </span>
              {deal.unit && (
                <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded-md">{deal.unit}</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-row-reverse mt-2 text-[10px] text-slate-600">
              <span>أضاف {deal.addedByName}</span>
              <span>·</span>
              <span>{new Date(deal.createdAt).toLocaleDateString('ar-EG')}</span>
            </div>
          </div>

          {/* Price Column */}
          <div className="flex flex-col items-center gap-1 shrink-0 min-w-[80px]">
            {/* Badges */}
            <div className="flex gap-1 flex-wrap justify-center">
              {discount && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-gradient-to-r from-amber-500/80 to-orange-500/80 text-white text-[9px] font-black">
                  <TrendingDown className="size-2.5" />{discount}%−
                </span>
              )}
              {expiring && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-red-500/80 text-white text-[9px] font-black animate-pulse">
                  <Clock className="size-2.5" />ينتهي
                </span>
              )}
            </div>
            {/* Price */}
            <div className="flex items-baseline gap-0.5">
              <span className={cn(
                "text-2xl font-black tracking-tight",
                isCheapest ? "text-emerald-400" : "text-white"
              )}>
                {deal.price}
              </span>
              <span className="text-[10px] text-slate-500 font-bold">ج.م</span>
            </div>
            {deal.originalPrice && (
              <span className="text-[11px] text-slate-600 line-through">{deal.originalPrice} ج.م</span>
            )}
            {isCheapest && (
              <span className="text-[9px] font-black text-emerald-400 mt-0.5">🏆 الأرخص</span>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.04]">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => !alreadyConfirmed && handleConfirm(deal.id)}
              disabled={alreadyConfirmed}
              className={cn(
                "flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all",
                alreadyConfirmed
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-white/[0.03] text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-400"
              )}
            >
              <ThumbsUp className="size-3" />
              {deal.confirmations > 0 && <span>{deal.confirmations}</span>}
              {alreadyConfirmed ? 'مؤكد' : 'تأكيد'}
            </button>
            <button
              onClick={() => !alreadyReported && handleReport(deal.id)}
              disabled={alreadyReported}
              className={cn(
                "flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all",
                alreadyReported
                  ? "bg-red-500/10 text-red-400"
                  : "bg-white/[0.03] text-slate-500 hover:bg-red-500/10 hover:text-red-400"
              )}
            >
              <Flag className="size-3" />
              {alreadyReported ? 'تم' : 'إبلاغ'}
            </button>
          </div>
          {deal.confirmations > 0 && (
            <span className="text-[9px] text-emerald-500/60 font-bold flex items-center gap-1">
              <Sparkles className="size-2.5" /> {deal.confirmations} تأكيد
            </span>
          )}
        </div>
      </div>
    );
  };

  // ─── Add Deal Dialog ────────────────────────────────────
  const AddDealDialog = () => (
    <Dialog open={showAddDeal} onOpenChange={setShowAddDeal}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-10 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl gap-1.5 text-xs font-bold shadow-lg shadow-indigo-500/20 border-0">
          <Plus className="size-3.5" /> أضف عرض
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-950/95 backdrop-blur-2xl border-white/10 rounded-[2rem] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right text-lg font-black">إضافة عرض جديد</DialogTitle>
          <DialogDescription className="text-right text-xs">شفت سعر في محل قريب؟ شاركه مع الناس!</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5 text-right">
            <Label className="text-xs font-bold text-slate-400">المحل</Label>
            <Select value={newStoreId} onValueChange={setNewStoreId}>
              <SelectTrigger className="bg-white/5 border-white/[0.08] text-right h-11 rounded-xl"><SelectValue placeholder="اختر المحل..." /></SelectTrigger>
              <SelectContent className="bg-slate-950 border-white/10">{stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name} — {s.type}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 text-right">
            <Label className="text-xs font-bold text-slate-400">اسم المنتج</Label>
            <Input value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="مثال: أرز مصري 5 كجم" className="bg-white/5 border-white/[0.08] h-11 rounded-xl text-right" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-bold text-slate-400">السعر (ج.م)</Label>
              <Input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="42" className="bg-white/5 border-white/[0.08] h-11 rounded-xl text-right" />
            </div>
            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-bold text-emerald-500/60">قبل الخصم (اختياري)</Label>
              <Input type="number" value={newOriginalPrice} onChange={e => setNewOriginalPrice(e.target.value)} placeholder="55" className="bg-white/5 border-white/[0.08] h-11 rounded-xl text-right" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-bold text-slate-400">الفئة</Label>
              <Select value={newCategory} onValueChange={v => setNewCategory(v as DealCategory)}>
                <SelectTrigger className="bg-white/5 border-white/[0.08] text-right h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-950 border-white/10">{DEAL_CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.emoji} {c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-bold text-slate-400">الوحدة</Label>
              <Input value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="1 كجم" className="bg-white/5 border-white/[0.08] h-11 rounded-xl text-right" />
            </div>
          </div>
          <div className="space-y-1.5 text-right">
            <Label className="text-xs font-bold text-slate-400">ينتهي خلال</Label>
            <Select value={newExpiresInDays} onValueChange={setNewExpiresInDays}>
              <SelectTrigger className="bg-white/5 border-white/[0.08] text-right h-11 rounded-xl"><SelectValue placeholder="مفتوح" /></SelectTrigger>
              <SelectContent className="bg-slate-950 border-white/10">
                <SelectItem value="1">يوم</SelectItem><SelectItem value="3">3 أيام</SelectItem>
                <SelectItem value="7">أسبوع</SelectItem><SelectItem value="14">أسبوعين</SelectItem><SelectItem value="30">شهر</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddDeal} disabled={addingDeal || !newProductName || !newPrice || !newStoreId}
            className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl font-bold text-sm">
            {addingDeal ? <Loader2 className="size-4 animate-spin" /> : 'نشر العرض'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // ─── Main Render ────────────────────────────────────────
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">

      {/* ═══ Hero Header ═══ */}
      <div className="relative px-6 pt-6 pb-5 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/[0.04] to-transparent pointer-events-none" />
        <div className="absolute -top-20 right-10 size-40 bg-violet-500/10 rounded-full blur-[80px]" />
        <div className="absolute -top-10 left-20 size-32 bg-indigo-500/10 rounded-full blur-[60px]" />

        <div className="relative flex items-start justify-between gap-4 flex-row-reverse mb-5">
          <div className="flex-1 text-right">
            <div className="flex items-center gap-3 flex-row-reverse mb-1">
              {viewMode !== 'browse' && (
                <button onClick={handleBack} className="text-[10px] text-slate-500 hover:text-white transition-colors flex items-center gap-0.5 flex-row-reverse">
                  <ChevronRight className="size-3" /> رجوع
                </button>
              )}
              <h1 className="text-2xl font-black text-white tracking-tight">
                {viewMode === 'store-view' ? selectedStore?.name : 'عروض المحلات'}
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {viewMode === 'store-view'
                ? `${selectedStore?.type} · ${selectedStore?.address}`
                : viewMode === 'product-results'
                  ? `${filteredDeals.length} نتيجة لـ "${activeSearch}"`
                  : 'ابحث عن أي منتج — واعرف مين بيبيعه أرخص 💰'
              }
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {deals.length === 0 && !loading && (
              <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding}
                className="text-[10px] h-9 rounded-xl border-white/[0.08] text-slate-400 hover:text-white gap-1">
                {seeding ? <Loader2 className="size-3 animate-spin" /> : <Package className="size-3" />} بيانات تجريبية
              </Button>
            )}
            <AddDealDialog />
          </div>
        </div>

        {/* ═══ Search Bar ═══ */}
        {viewMode !== 'store-view' && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 rounded-2xl blur-sm" />
            <div className="relative flex items-center bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
              <Search className="size-4 text-slate-500 mr-4 shrink-0" />
              <Input
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="ابحث عن أي منتج... أرز، زيت، سكر، فراخ"
                className="border-0 bg-transparent h-12 text-right text-sm placeholder:text-slate-600 focus-visible:ring-0"
              />
              <div className="flex items-center gap-1 ml-1.5">
                {activeSearch && (
                  <button onClick={handleBack} className="size-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-500"><X className="size-3.5" /></button>
                )}
                <Button size="sm" onClick={handleSearch} className="h-9 rounded-xl text-[11px] bg-gradient-to-r from-violet-600 to-indigo-600 px-5 font-bold mr-1.5 my-1.5">بحث</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Filters Bar ═══ */}
      <div className="px-6 py-3 flex flex-col gap-3 border-b border-white/[0.04]">
        {/* Categories */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button onClick={() => setCategoryFilter('all')}
            className={cn("shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
              categoryFilter === 'all' ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20" : "bg-white/[0.03] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300 border border-white/[0.04]"
            )}>الكل</button>
          {DEAL_CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setCategoryFilter(cat.id)}
              className={cn("shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap",
                categoryFilter === cat.id ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20" : "bg-white/[0.03] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300 border border-white/[0.04]"
              )}>{cat.emoji} {cat.label}</button>
          ))}
        </div>
        {/* Sort */}
        <div className="flex items-center gap-1.5 flex-row-reverse text-[10px]">
          <ArrowUpDown className="size-3 text-slate-600" />
          {([
            { id: 'price' as SortMode, label: 'الأرخص' },
            { id: 'discount' as SortMode, label: 'أكبر خصم' },
            { id: 'confirmations' as SortMode, label: 'الأكثر تأكيداً' },
            { id: 'newest' as SortMode, label: 'الأحدث' },
          ] as const).map(o => (
            <button key={o.id} onClick={() => setSortMode(o.id)}
              className={cn("px-2 py-1 rounded-md font-bold transition-all",
                sortMode === o.id ? "bg-white/10 text-white" : "text-slate-600 hover:text-slate-300"
              )}>{o.label}</button>
          ))}
        </div>
      </div>

      {/* ═══ Content ═══ */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="size-8 animate-spin text-violet-500" />
              <span className="text-xs text-slate-500 font-bold">جاري تحميل العروض...</span>
            </div>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center gap-5 py-20">
            <div className="size-24 rounded-3xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 flex items-center justify-center border border-white/5">
              <ShoppingCart className="size-10 text-violet-400/50" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white mb-1">
                {activeSearch ? `مفيش نتائج لـ "${activeSearch}"` : 'مفيش عروض لسه'}
              </h3>
              <p className="text-xs text-slate-500 max-w-[280px]">
                {activeSearch ? 'كن أول من يضيف سعر المنتج ده!' : 'ابدأ بإضافة أول عرض شفته أو حمّل بيانات تجريبية.'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowAddDeal(true)} className="rounded-xl gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-indigo-500/20">
                <Plus className="size-4" /> أضف عرض
              </Button>
              {!activeSearch && (
                <Button onClick={handleSeed} variant="outline" disabled={seeding} className="rounded-xl gap-1.5 border-white/[0.08] text-slate-400">
                  {seeding ? <Loader2 className="size-4 animate-spin" /> : <Package className="size-4" />} بيانات تجريبية
                </Button>
              )}
            </div>
          </div>
        ) : viewMode === 'product-results' ? (
          <div className="space-y-8 max-w-2xl mx-auto">
            {Object.entries(groupedByProduct).map(([productName, productDeals]) => (
              <div key={productName}>
                <div className="flex items-center gap-3 flex-row-reverse mb-3">
                  <h2 className="text-sm font-black text-white flex items-center gap-1.5 flex-row-reverse">
                    {DEAL_CATEGORIES.find(c => c.id === productDeals[0].category)?.emoji} {productName}
                  </h2>
                  <Badge variant="outline" className="text-[9px] border-white/[0.08] text-slate-500 font-bold">
                    {productDeals.length} محل
                  </Badge>
                </div>
                <div className="space-y-2">
                  {productDeals.map((deal, i) => (
                    <DealCard key={deal.id} deal={deal} isCheapest={i === 0} rank={i + 1} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 max-w-2xl mx-auto">
            {viewMode === 'store-view' && selectedStore && (
              <div className="p-5 rounded-2xl bg-gradient-to-l from-indigo-500/[0.06] to-transparent border border-white/[0.06] flex items-center gap-4 flex-row-reverse mb-4">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center border border-indigo-500/10">
                  <StoreIcon className="size-7 text-indigo-400" />
                </div>
                <div className="flex-1 text-right">
                  <h2 className="font-black text-lg text-white">{selectedStore.name}</h2>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 flex-row-reverse mt-0.5">
                    <MapPin className="size-3" /> {selectedStore.address}
                  </p>
                  <div className="flex items-center gap-3 flex-row-reverse mt-1.5">
                    <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-md">{selectedStore.type}</span>
                    <span className="text-[10px] text-violet-400 font-bold">{storeDeals.length} عرض</span>
                  </div>
                </div>
              </div>
            )}
            {filteredDeals.map((deal, i) => (
              <DealCard key={deal.id} deal={deal} showStore={viewMode !== 'store-view'} isCheapest={sortMode === 'price' && i === 0} rank={viewMode !== 'store-view' ? i + 1 : undefined} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
