
"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, AlertCircle, CheckCircle2, XCircle, Info } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { updateUserProfile, ConsentStatus } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

/**
 * [STABILITY_ANCHOR: PRIVACY_CONSENT_V1.0]
 * نافذة الموافقة على معالجة البيانات - تضمن وعي المستخدم ببروتوكولات الخصوصية.
 */
export function PrivacyConsentModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<ConsentStatus | null>(null);
  const [verificationText, setVerificationText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user && user.dataConsent === 'none') {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [user]);

  const requiredAgreeText = "أوافق على الشروط";
  const requiredDeclineText = "أرفض المشاركة";

  const handleFinalize = async () => {
    if (!user || !pendingChoice) return;
    
    const isValid = pendingChoice === 'agreed' 
      ? verificationText.trim() === requiredAgreeText
      : verificationText.trim() === requiredDeclineText;

    if (!isValid) return;

    setIsUpdating(true);
    try {
      await updateUserProfile(user.id, { dataConsent: pendingChoice });
      setIsOpen(false);
    } catch (e) {
      console.error("Consent Sync Error:", e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px] bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right outline-none">
        <DialogHeader>
          <div className="flex justify-center mb-6">
            <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-2xl">
              <ShieldCheck className="size-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-3xl font-headline font-bold text-white text-center">بروتوكول خصوصية البيانات</DialogTitle>
          <DialogDescription className="text-muted-foreground text-center text-sm leading-relaxed mt-4">
            نحن في NexusAI نستخدم بيانات تفاعلك مع المحرك العصبي حصرياً لتحسين جودة الردود ومعايرة البروتوكولات الذكية. خصوصيتك هي أولويتنا القصوى.
          </DialogDescription>
        </DialogHeader>

        {!pendingChoice ? (
          <div className="space-y-6 py-6">
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-start gap-4 flex-row-reverse">
              <Info className="size-5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed">
                الموافقة تعني تفعيل ميزات التحسين الصامت، الردود الفائقة، وإرسال تقارير الأداء للمشرفين. الرفض سيعطل ميزات الذكاء الاصطناعي والربط بالسجل العالمي للرسائل.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => setPendingChoice('agreed')}
                className="h-14 bg-primary hover:bg-primary/90 rounded-2xl font-bold gap-2 text-lg"
              >
                <CheckCircle2 className="size-5" /> موافق
              </Button>
              <Button 
                onClick={() => setPendingChoice('declined')}
                variant="outline"
                className="h-14 border-white/10 hover:bg-red-500/10 hover:text-red-400 rounded-2xl font-bold gap-2 text-lg"
              >
                <XCircle className="size-5" /> أرفض
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-right">
              <p className="text-sm font-bold text-white mb-2">تأكيد الوعي بالخيار:</p>
              <p className="text-[10px] text-muted-foreground mb-4">
                يرجى كتابة عبارة <span className="text-primary font-black">"{pendingChoice === 'agreed' ? requiredAgreeText : requiredDeclineText}"</span> في المربع أدناه للتأكد من قراءتك للبروتوكول.
              </p>
              <Textarea 
                value={verificationText}
                onChange={(e) => setVerificationText(e.target.value)}
                placeholder="اكتب العبارة المطلوبة هنا..."
                className="bg-white/5 border-white/10 h-24 rounded-2xl text-right text-white focus-visible:ring-primary"
                dir="rtl"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleFinalize}
                disabled={isUpdating || (pendingChoice === 'agreed' ? verificationText !== requiredAgreeText : verificationText !== requiredDeclineText)}
                className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold"
              >
                {isUpdating ? "جاري المزامنة..." : "تأكيد الخيار"}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => { setPendingChoice(null); setVerificationText(""); }}
                className="text-muted-foreground rounded-xl"
              >
                تغيير
              </Button>
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-[9px] text-muted-foreground uppercase tracking-[0.3em] font-medium">Nexus Privacy Shield v1.0 • E2EE Active</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
