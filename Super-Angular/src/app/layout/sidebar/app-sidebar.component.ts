import { Component, inject } from '@angular/core';
import { SidebarService } from '../../core/sidebar.service';
import { LucideAngularModule, Home, HelpCircle, FileText, FileDown, ShieldCheck, Gamepad2, Settings } from 'lucide-angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [LucideAngularModule, CommonModule],
  templateUrl: './app-sidebar.component.html',
  styleUrls: ['./app-sidebar.component.scss']
})
export class AppSidebarComponent {
  sidebarService = inject(SidebarService);

  isCollapsed = this.sidebarService.isCollapsed;
  position = this.sidebarService.position;

  // Icons for demo
  HomeIcon = Home;
  HelpCircleIcon = HelpCircle;
  FileTextIcon = FileText;
  FileDownIcon = FileDown;
  ShieldCheckIcon = ShieldCheck;
  Gamepad2Icon = Gamepad2;
  SettingsIcon = Settings;

  // Sample items
  navItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: this.HomeIcon },
    { id: 'qa', label: 'الأسئلة والأجوبة', icon: this.HelpCircleIcon },
    { id: 'library', label: 'المكتبة الشاملة', icon: this.FileTextIcon },
    { id: 'downloads', label: 'إدارة التنزيلات', icon: this.FileDownIcon },
    { id: 'admin', label: 'لوحة التحكم', icon: this.ShieldCheckIcon },
    { id: 'arcade', label: 'ألعاب نكسوس', icon: this.Gamepad2Icon },
  ];

  toggleCollapse() {
    this.sidebarService.toggleCollapsed();
  }
}
