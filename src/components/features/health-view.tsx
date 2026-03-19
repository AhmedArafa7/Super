"use client";

import React, { useState, useEffect } from "react";
import { 
  HeartPulse, 
  Dumbbell, 
  Droplets, 
  Calculator, 
  Timer, 
  Plus, 
  Minus, 
  RotateCcw, 
  Play, 
  Pause, 
  Zap,
  Flame,
  Scale,
  BrainCircuit,
  Lightbulb
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * [STABILITY_ANCHOR: HEALTH_VIEW_V1]
 * المكون الرئيسي للصحة والرياضة - يدعم حساب BMI، تتبع المياه، ومؤقت HIIT.
 */
export function HealthView() {
  // BMI State
  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [bmi, setBmi] = useState<number | null>(null);

  // Water State
  const [waterGlasses, setWaterGlasses] = useState<number>(0);
  const waterGoal = 8;

  // Timer State
  const [workTime, setWorkTime] = useState<number>(30);
  const [restTime, setRestTime] = useState<number>(10);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isWorkPeriod, setIsWorkPeriod] = useState<boolean>(true);

  // Health Tips
  const healthTips = [
    "شرب الماء بانتظام يحسن التركيز ويقلل الصداع.",
    "المشي لمدة 30 دقيقة يومياً يقلل من مخاطر أمراض القلب.",
    "النوم الكافي (7-9 ساعات) ضروري جداً لتعافي العضلات.",
    "تناول الخضروات الورقية يحسن من جودة هضمك وطاقتك.",
    "تمارين الإطالة تساعد في تقليل التوتر العضلي الناتج عن الجلوس الطويل."
  ];
  const [currentTip, setCurrentTip] = useState(healthTips[0]);

  useEffect(() => {
    setCurrentTip(healthTips[Math.floor(Math.random() * healthTips.length)]);
  }, []);

  // BMI Logic
  const calculateBmi = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (w > 0 && h > 0) {
      setBmi(parseFloat((w / (h * h)).toFixed(1)));
    }
  };

  const getBmiCategory = (val: number) => {
    if (val < 18.5) return { label: "نقص وزن", color: "text-blue-400" };
    if (val < 25) return { label: "وزن مثالي", color: "text-green-400" };
    if (val < 30) return { label: "زيادة وزن", color: "text-amber-400" };
    return { label: "سمنة مفرطة", color: "text-red-400" };
  };

  // Timer Logic
  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Toggle periods
      if (isWorkPeriod) {
        setIsWorkPeriod(false);
        setTimeLeft(restTime);
      } else {
        setIsWorkPeriod(true);
        setTimeLeft(workTime);
      }
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isWorkPeriod, workTime, restTime]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setIsWorkPeriod(true);
    setTimeLeft(workTime);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 font-sans text-right" dir="rtl">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-red-500/10 border border-red-500/20 rounded-full mb-2">
            <HeartPulse className="size-3 text-red-400 animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-red-400 tracking-widest">Wellness Protocol Active</span>
          </div>
          <h1 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4">
            الصحة والرياضة
            <Dumbbell className="text-indigo-400 size-10" />
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            استثمر في صحتك من خلال متابعة قياساتك، ترطيب جسمك، وتنظيم فترات تمرينك الذكية.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        
        {/* BMI Calculator */}
        <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <Calculator className="text-indigo-400" /> حاسبة كتلة الجسم (BMI)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-bold">الوزن (كجم)</label>
                <Input 
                  type="number" 
                  placeholder="70" 
                  className="bg-white/5 border-white/10 h-12 text-center text-lg" 
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-bold">الطول (سم)</label>
                <Input 
                  type="number" 
                  placeholder="175" 
                  className="bg-white/5 border-white/10 h-12 text-center text-lg" 
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={calculateBmi} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-2xl h-12 font-bold text-lg gap-2">
              <Scale className="size-5" /> احسب النتيجة
            </Button>

            {bmi !== null && (
              <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-3xl text-center space-y-2 animate-in zoom-in duration-300">
                <p className="text-sm text-muted-foreground">مؤشر كتلة جسمك هو:</p>
                <h4 className="text-5xl font-black text-white">{bmi}</h4>
                <Badge variant="outline" className={cn("mt-2 text-sm px-4 py-1 border-white/10", getBmiCategory(bmi).color)}>
                  {getBmiCategory(bmi).label}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Water Tracker */}
        <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <Droplets className="text-blue-400" /> متتبع شرب الماء
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8 flex-1">
            <div className="relative flex items-center justify-center">
              <div className="size-48 rounded-full border-8 border-white/5 flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-blue-500/20 transition-all duration-1000" 
                  style={{ height: `${Math.min((waterGlasses / waterGoal) * 100, 100)}%` }} 
                />
                <h4 className="text-5xl font-black text-white z-10">{waterGlasses}</h4>
                <p className="text-xs text-muted-foreground font-bold uppercase z-10">من {waterGoal} أكواب</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
                className="size-16 rounded-2xl border-white/10 bg-white/5 hover:bg-red-500/10 text-red-400"
              >
                <Minus className="size-6" />
              </Button>
              <Button 
                onClick={() => setWaterGlasses(waterGlasses + 1)}
                className="flex-1 h-16 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-xl gap-3 shadow-xl shadow-blue-600/20"
              >
                <Droplets className="size-6" /> إضافة كوب
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                <span>الهدف اليومي</span>
                <span>{Math.round((waterGlasses / waterGoal) * 100)}%</span>
              </div>
              <Progress value={(waterGlasses / waterGoal) * 100} className="h-2 bg-white/5" />
            </div>
          </CardContent>
        </Card>

        {/* HIIT Timer */}
        <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <Timer className="text-amber-400" /> مؤقت تمارين HIIT
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8 flex-1">
            <div className={cn(
              "p-8 rounded-3xl border transition-colors duration-500 text-center space-y-2",
              isWorkPeriod ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"
            )}>
              <Badge className={cn("mb-2 uppercase tracking-widest", isWorkPeriod ? "bg-red-500" : "bg-green-500")}>
                {isWorkPeriod ? "فترة التمرين" : "فترة الاستراحة"}
              </Badge>
              <h4 className="text-7xl font-black text-white tabular-nums">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </h4>
            </div>

            <div className="flex gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={resetTimer}
                className="size-14 rounded-2xl border-white/10 bg-white/5"
              >
                <RotateCcw className="size-6" />
              </Button>
              <Button 
                onClick={toggleTimer}
                className={cn(
                  "flex-1 h-14 rounded-2xl font-bold text-lg gap-2",
                  isActive ? "bg-slate-800 hover:bg-slate-700" : "bg-amber-600 hover:bg-amber-500 shadow-xl shadow-amber-600/20"
                )}
              >
                {isActive ? <Pause className="size-5" /> : <Play className="size-5" />}
                {isActive ? "إيقاف مؤقت" : "ابدأ التحدي"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-bold uppercase">تمرين (ثانية)</label>
                <Input type="number" value={workTime} onChange={(e) => { 
                  const v = parseInt(e.target.value); 
                  setWorkTime(v); 
                  if (!isActive) setTimeLeft(v); 
                }} className="h-10 bg-white/5 border-white/10 text-center font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-bold uppercase">راحة (ثانية)</label>
                <Input type="number" value={restTime} onChange={(e) => setRestTime(parseInt(e.target.value))} className="h-10 bg-white/5 border-white/10 text-center font-bold" />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Health Tip Section */}
      <section className="glass border-white/5 rounded-[2.5rem] p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <BrainCircuit className="size-64" />
        </div>
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 text-indigo-400">
            <Lightbulb className="size-5" />
            <span className="text-xs font-black uppercase tracking-widest">Nexus Health Wisdom</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight">
            "{currentTip}"
          </h2>
          <p className="text-slate-400">نصيحة تلقائية من خوادم النخاع الصحية لتحسين جودة حياتك اليومية.</p>
          <Button 
            variant="ghost" 
            onClick={() => setCurrentTip(healthTips[Math.floor(Math.random() * healthTips.length)])}
            className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10 font-bold gap-2 p-0 h-auto"
          >
            نصيحة أخرى <RotateCcw className="size-3" />
          </Button>
        </div>
      </section>

      {/* Extra Info */}
      <div className="flex flex-wrap gap-4 items-center justify-center pt-10 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
        <div className="flex items-center gap-2">
          <Flame className="size-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Burn Calories</span>
        </div>
        <div className="size-1 rounded-full bg-white/20" />
        <div className="flex items-center gap-2">
          <Zap className="size-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Stay Energetic</span>
        </div>
        <div className="size-1 rounded-full bg-white/20" />
        <div className="flex items-center gap-2">
          <Droplets className="size-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Keep Hydrated</span>
        </div>
      </div>
    </div>
  );
}
