import { Component, inject } from '@angular/core';
import { SidebarService } from '../../core/sidebar.service';
import { LucideAngularModule, Search, Bell, Wallet, ChevronUp } from 'lucide-angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss']
})
export class AppHeaderComponent {
  sidebarService = inject(SidebarService);

  // Icons
  SearchIcon = Search;
  BellIcon = Bell;
  WalletIcon = Wallet;
  ChevronUpIcon = ChevronUp;

  unreadCount = 0; // Will be connected to a notification service later

  toggleHeader() {
    this.sidebarService.toggleHeader();
  }

  navigateToWallet() {
    // Router logic will go here
  }
}
