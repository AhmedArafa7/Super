import { Routes } from '@angular/router';
import { WeTubeHomeComponent } from './features/wetube/components/wetube-home/wetube-home';
import { WeTubeWatchViewComponent } from './features/wetube/components/wetube-watch-view/wetube-watch-view';
import { WeTubeComponent } from './features/wetube/wetube.component';
import { HealthComponent } from './features/health/health.component';
import { HisnComponent } from './features/hisn/hisn.component';
import { TimeComponent } from './features/time/time.component';
import { LabComponent } from './features/lab/lab.component';
import { WalletComponent } from './features/wallet/wallet.component';
import { ChatComponent } from './features/chat/chat.component';
import { SheetsComponent } from './features/sheets/sheets.component';
import { MicrocontrollerLabComponent } from './features/microcontroller-lab/microcontroller-lab.component';
import { VaultComponent } from './features/vault/vault.component';
import { MarketComponent } from './features/market/market.component';
import { DealsComponent } from './features/deals/deals.component';
import { SettingsComponent } from './features/settings/settings.component';
import { QAComponent } from './features/qa/qa.component';
import { AdsComponent } from './features/ads/ads.component';
import { AdminComponent } from './features/admin/admin.component';
import { LauncherComponent } from './features/launcher/launcher.component';
import { DownloadsComponent } from './features/downloads/downloads.component';
import { PeerChatComponent } from './features/peer-chat/peer-chat.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { LearningComponent } from './features/learning/learning.component';

export const routes: Routes = [
  { path: '', redirectTo: '/stream', pathMatch: 'full' },
  {
    path: 'launcher',
    component: LauncherComponent,
    title: 'منصة التطبيقات'
  },
  {
    path: 'downloads',
    component: DownloadsComponent,
    title: 'مركز التحميل والذاكرة'
  },
  {
    path: 'peer-chat',
    component: PeerChatComponent,
    title: 'تواصل العقد الفردية'
  },
  {
    path: 'notifications',
    component: NotificationsComponent,
    title: 'مركز التنبيهات العصبية'
  },
  {
    path: 'learning',
    component: LearningComponent,
    title: 'المكتبة المعرفية'
  },
  { 
    path: 'stream', 
    component: WeTubeComponent,
    children: [
      { path: '', component: WeTubeHomeComponent, title: 'WeTube - Stream' },
      { path: 'watch/:id', component: WeTubeWatchViewComponent, title: 'WeTube - Watch' }
    ]
  },
  {
    path: 'health',
    component: HealthComponent,
    title: 'الصحة والرياضة'
  },
  {
    path: 'hisn',
    component: HisnComponent,
    title: 'حصن المسلم'
  },
  {
    path: 'time',
    component: TimeComponent,
    title: 'تنظيم الوقت'
  },
  {
    path: 'lab',
    component: LabComponent,
    title: 'المختبر العصبي'
  },
  {
    path: 'wallet',
    component: WalletComponent,
    title: 'المحفظة الذكية'
  },
  {
    path: 'chat',
    component: ChatComponent,
    title: 'نظام الحوار الذكي'
  },
  {
    path: 'sheets',
    component: SheetsComponent,
    title: 'Nexus Sheets'
  },
  {
    path: 'microcontroller-lab',
    component: MicrocontrollerLabComponent,
    title: 'مختبر المتحكمات الدقيقة'
  },
  {
    path: 'vault',
    component: VaultComponent,
    title: 'الخزنة المركزية'
  },
  {
    path: 'market',
    component: MarketComponent,
    title: 'سوق العقد عصبياً'
  },
  {
    path: 'deals',
    component: DealsComponent,
    title: 'عروض المحلات'
  },
  {
    path: 'settings',
    component: SettingsComponent,
    title: 'الإعدادات'
  },
  {
    path: 'qa',
    component: QAComponent,
    title: 'الأسئلة والطلبات'
  },
  {
    path: 'ads',
    component: AdsComponent,
    title: 'مركز الإعلانات'
  },
  {
    path: 'admin',
    component: AdminComponent,
    title: 'لوحة الإدارة'
  },
  { path: '**', redirectTo: '/stream' }
];
