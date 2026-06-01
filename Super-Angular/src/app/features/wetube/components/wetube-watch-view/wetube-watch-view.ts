import { Component, inject, OnInit, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SiNeuroVideoPlayerComponent } from '../nexus-video-player/nexus-video-player';
import { WeTubeService } from '../../wetube.service';
import { SidebarService } from '../../../../core/sidebar.service';

@Component({
  selector: 'app-wetube-watch-view',
  standalone: true,
  imports: [CommonModule, SiNeuroVideoPlayerComponent],
  templateUrl: './wetube-watch-view.html',
  styleUrls: ['./wetube-watch-view.scss']
})
export class WeTubeWatchViewComponent implements OnInit {
  id = input.required<string>();
  
  sidebar = inject(SidebarService);
  wetube = inject(WeTubeService);
  router = inject(Router);

  video = computed(() => {
    return this.wetube.allHomeContent().find(v => v.id === this.id());
  });

  ngOnInit() {
    // Auto-Cinema Mode: Collapse sidebar when watching
    this.sidebar.setCollapsed(true);
  }

  onClose() {
    this.router.navigate(['/stream']);
  }
}

