"use client";

import React, { useState, useRef } from "react";
import { Loader2, UploadCloud, CheckCircle2, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { addSubscription } from "@/lib/subscription-store";

interface ImportSubscriptionsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
}

/**
 * [STABILITY_ANCHOR: IMPORT_SUBSCRIPTIONS_V1.0]
 * موديول لاستيراد اشتراكات يوتيوب من ملف CSV (Google Takeout) لتخادي تعقيدات OAuth.
 */
export function ImportSubscriptionsModal({ isOpen, onOpenChange, userId }: ImportSubscriptionsModalProps) {
    const { toast } = useToast();
    const [isImporting, setIsImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [total, setTotal] = useState(0);
    const [errorMsg, setErrorMsg] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            setErrorMsg("الرجاء رفع ملف بصيغة CSV (subscriptions.csv)");
            return;
        }

        setErrorMsg("");
        setIsImporting(true);
        setProgress(0);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                // Basic CSV splitting (Google Takeout subscriptions.csv usually has: Channel Id, Channel Url, Channel Title)
                const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

                if (lines.length <= 1) {
                    throw new Error("الملف فارغ أو لا يحتوي على بيانات صحيحة");
                }

                // Header usually is: Channel Id, Channel Url, Channel Title
                const headers = lines[0].split(',');
                const idIdx = headers.findIndex(h => h.toLowerCase().includes('id'));
                const titleIdx = headers.findIndex(h => h.toLowerCase().includes('title'));

                const dataRows = lines.slice(1);
                setTotal(dataRows.length);

                let successCount = 0;

                for (let i = 0; i < dataRows.length; i++) {
                    const row = dataRows[i];
                    // Handle cases where title has commas (wrapped in quotes)
                    const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(',');

                    let channelId = (idIdx !== -1 && matches[idIdx]) ? matches[idIdx].replace(/"/g, '') : '';
                    let channelTitle = (titleIdx !== -1 && matches[titleIdx]) ? matches[titleIdx].replace(/"/g, '') : '';

                    // Fallback if formatting is weird
                    if (!channelId && matches.length >= 2) {
                        channelId = matches[0].replace(/"/g, '');
                        channelTitle = matches[2] ? matches[2].replace(/"/g, '') : 'قناة غير معروفة';
                    }

                    if (channelId && channelId.startsWith('UC')) {
                        const channelUrl = `https://www.youtube.com/channel/${channelId}`;
                        try {
                            await addSubscription(userId, channelUrl, channelTitle || "قناة جديدة", channelId, "");
                            successCount++;
                        } catch (err) {
                            console.warn("Failed to add:", channelTitle, err);
                        }
                    }
                    setProgress(i + 1);
                }

                toast({
                    title: "اكتمل الاستيراد",
                    description: `تم إضافة ${successCount} قناة بنجاح من أصل ${dataRows.length} قناة.`,
                });
        
        setTimeout(() => {
          onOpenChange(false);
          setIsImporting(false);
        }, 1500);

      } catch (err: any) {
        setErrorMsg(err.message || "حدث خطأ أثناء قراءة الملف");
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg("حدث خطأ أثناء قراءة الملف. الرجاء المحاولة مرة أخرى.");
      setIsImporting(false);
    };

    reader.readAsText(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isImporting && onOpenChange(open)}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right outline-none">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center justify-end gap-3 text-white">
            استيراد الاشتراكات
            <UploadCloud className="text-blue-500" />
          </DialogTitle>
          <DialogDescription className="text-right leading-relaxed mt-2 text-muted-foreground">
            تجاوزاً لتعقيدات أذونات جوجل، يمكنك استيراد اشتراكاتك فوراً! 
            <br/><br/>
            1. اذهب إلى منصة <a href="https://takeout.google.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1 font-bold">Google Takeout</a>
            <br/>
            2. صفي الخيارات واختر (YouTube) فقط، وبداخله اختر (Subscriptions).
            <br/>
            3. حمل الملف وافتحه، ستجد ملف باسم <code className="bg-white/10 px-1 rounded text-white">subscriptions.csv</code>
            <br/>
            4. ارفعه هنا ليتم استيرادهم فوراً.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-8 flex flex-col items-center justify-center">
          
          {!isImporting && progress === 0 && (
             <div 
               className="border-2 border-dashed border-white/20 rounded-2xl p-10 w-full flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-center group"
               onClick={() => fileInputRef.current?.click()}
             >
                <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                   <FileSpreadsheet className="size-8 text-white/60 group-hover:text-blue-400" />
                </div>
                <h3 className="text-white font-bold mb-1">اختر ملف الاشتراكات</h3>
                <p className="text-sm text-muted-foreground">subscriptions.csv</p>
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
             </div>
          )}

          {isImporting && (
             <div className="w-full flex flex-col items-center space-y-4 text-center">
                <Loader2 className="size-12 animate-spin text-blue-500" />
                <h3 className="text-white font-bold text-lg">جاري الاستيراد...</h3>
                <p className="text-sm text-muted-foreground">
                   تم إضافة {progress} من أصل {total}
                </p>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mt-4">
                   <div 
                     className="h-full bg-blue-500 transition-all duration-300" 
                     style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
                   ></div>
                </div>
             </div>
          )}

          {progress > 0 && !isImporting && (
             <div className="w-full flex flex-col items-center space-y-4 text-center">
                <CheckCircle2 className="size-16 text-green-500" />
                <h3 className="text-white font-bold text-xl">اكتمل بنجاح!</h3>
             </div>
          )}

          {errorMsg && (
             <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-xl w-full">
                <AlertCircle className="size-5 shrink-0" />
                <p className="text-sm">{errorMsg}</p>
             </div>
          )}

        </div>

        <DialogFooter>
          <Button 
            onClick={() => onOpenChange(false)} 
            disabled={isImporting} 
            variant="ghost"
            className="w-full h-12 rounded-xl transition-all"
          >
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
