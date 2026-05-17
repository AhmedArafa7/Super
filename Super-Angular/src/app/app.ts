import { Component } from '@angular/core';
import { AppShellComponent } from './layout/app-shell/app-shell';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppShellComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {}
