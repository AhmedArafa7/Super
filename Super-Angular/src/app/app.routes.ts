import { Routes } from '@angular/router';
import { WeTubeShellComponent } from './features/wetube/components/wetube-shell/wetube-shell';
import { WeTubeHomeComponent } from './features/wetube/components/wetube-home/wetube-home';
import { WeTubeWatchViewComponent } from './features/wetube/components/wetube-watch-view/wetube-watch-view';
import { WeTubeShortsComponent } from './features/wetube/components/wetube-shorts/wetube-shorts';
import { WeTubeStudioComponent } from './features/wetube/components/wetube-studio/wetube-studio';
import { WeTubeLibraryComponent } from './features/wetube/components/wetube-library/wetube-library';
import { WeTubeSubscriptionsComponent } from './features/wetube/components/wetube-subscriptions/wetube-subscriptions';
import { WeTubeNotificationsComponent } from './features/wetube/components/wetube-notifications/wetube-notifications';
import { WeTubeOnboardingComponent } from './features/wetube/components/wetube-onboarding/wetube-onboarding';
import { HealthComponent } from './features/health/health.component';

export const routes: Routes = [
  { path: '', redirectTo: '/stream', pathMatch: 'full' },
  {
    path: 'stream',
    component: WeTubeShellComponent,
    children: [
      { path: 'onboarding', component: WeTubeOnboardingComponent, title: 'WeTube - مرحباً' },
      { path: '', component: WeTubeHomeComponent, title: 'WeTube - Stream' },
      { path: 'watch/:id', component: WeTubeWatchViewComponent, title: 'WeTube - Watch' },
      { path: 'shorts', component: WeTubeShortsComponent, title: 'WeTube - Shorts' },
      { path: 'studio', component: WeTubeStudioComponent, title: 'WeTube - Studio' },
      { path: 'library', component: WeTubeLibraryComponent, title: 'WeTube - Library' },
      { path: 'subscriptions', component: WeTubeSubscriptionsComponent, title: 'WeTube - Subscriptions' },
      { path: 'notifications', component: WeTubeNotificationsComponent, title: 'WeTube - Notifications' }
    ]
  },
  {
    path: 'health',
    component: HealthComponent,
    title: 'الصحة والرياضة'
  },
  { path: '**', redirectTo: '/stream' }
];
