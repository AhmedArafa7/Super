import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { WeTubeService } from '../../wetube.service';
import { WETUBE_CATEGORIES } from '../../wetube.model';

@Component({
  selector: 'app-wetube-home',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideDynamicIcon],
  templateUrl: './wetube-home.html',
  styles: [`
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class WeTubeHomeComponent {
  wetube = inject(WeTubeService);
  categories = WETUBE_CATEGORIES;
}
