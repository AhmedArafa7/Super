
"use client";

import React, { useState } from "react";
import { User, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserProfile } from "@/lib/auth-store";
import { useToast } from "@/hooks/use-toast";

export function ProfileSettings({ user }: any) {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateProfile = async () => {
    if (!user?.id || !displayName.trim()) return;
    setIsUpdating(true);
    try {
      await updateUserProfile(user.id, { name: displayName });
      toast({ title: "Profile Updated", description: "Your neural identity has been synchronized." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      <Card className="glass border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center text-center">
        <div className="relative group mb-6">
          <div className="size-32 rounded-[2.5rem] bg-indigo-500/10 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
            <User className="size-12 text-muted-foreground" />
          </div>
        </div>
        <h3 dir="auto" className="text-xl font-bold text-white">{user?.name}</h3>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">@{user?.username}</p>
      </Card>

      <Card className="lg:col-span-2 glass border-white/5 rounded-[2.5rem] p-8">
        <CardHeader className="px-0 pt-0 text-right">
          <CardTitle>إعدادات الهوية</CardTitle>
          <CardDescription>تحديث معلومات العقدة العامة الخاصة بك.</CardDescription>
        </CardHeader>
        <div className="space-y-6 mt-4">
          <div className="grid gap-2">
            <Label htmlFor="displayName" className="text-right">الاسم المعروض</Label>
            <Input 
              id="displayName" 
              dir="auto"
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-white/5 border-white/10 h-12 rounded-xl text-right"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="username" className="text-right">معرف Nexus (Username)</Label>
            <Input id="username" value={user?.username} disabled className="bg-white/5 border-white/10 h-12 rounded-xl opacity-50 cursor-not-allowed" />
            <p className="text-[10px] text-muted-foreground italic text-right">لا يمكن تعديل معرفات Nexus بمجرد تثبيتها.</p>
          </div>
          <Button 
            onClick={handleUpdateProfile} 
            disabled={isUpdating || displayName === user?.name}
            className="bg-primary rounded-xl h-12 px-8 shadow-lg shadow-primary/20 w-full sm:w-auto"
          >
            {isUpdating ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
            مزامنة البيانات
          </Button>
        </div>
      </Card>
    </div>
  );
}
