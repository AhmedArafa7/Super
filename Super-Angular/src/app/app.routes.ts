import { Routes } from '@angular/router';
import { WeTubeHomeComponent } from './features/wetube/components/wetube-home/wetube-home';
import { WeTubeWatchViewComponent } from './features/wetube/components/wetube-watch-view/wetube-watch-view';

export const routes: Routes = [
  { path: '', redirectTo: '/stream', pathMatch: 'full' },
  { 
    path: 'stream', 
    component: WeTubeHomeComponent,
    title: 'WeTube - Stream' 
  },
  { 
    path: 'stream/watch/:id', 
    component: WeTubeWatchViewComponent,
    title: 'WeTube - Watch'
  },
  { path: '**', redirectTo: '/stream' }
];
