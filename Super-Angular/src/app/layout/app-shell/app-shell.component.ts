import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarService } from '../../core/sidebar.service';
import { AppHeaderComponent } from '../header/app-header.component';
import { AppSidebarComponent } from '../sidebar/app-sidebar.component';
import { LucideAngularModule, Layers, ChevronDown } from 'lucide-angular';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AppHeaderComponent, AppSidebarComponent, LucideAngularModule],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss']
})
export class AppShellComponent {
  sidebarService = inject(SidebarService);

  isCollapsed = this.sidebarService.isCollapsed;
  isVisible = this.sidebarService.isVisible;
  isHeaderVisible = this.sidebarService.isHeaderVisible;
  width = this.sidebarService.width;
  position = this.sidebarService.position;

  // Icons
  LayersIcon = Layers;
  ChevronDownIcon = ChevronDown;

  toggleHeader() {
    this.sidebarService.toggleHeader();
  }

  showSidebar() {
    this.sidebarService.setVisible(true);
  }
}
