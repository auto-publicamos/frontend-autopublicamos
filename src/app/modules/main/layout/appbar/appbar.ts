import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconLock } from '@src/app/components/icons/icon-lock';

@Component({
  selector: 'app-appbar',
  imports: [CommonModule, IconLock],
  templateUrl: './appbar.html',
  styleUrl: './appbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Appbar {
  navItems = signal([
    { name: 'Canva', active: true, hideOnMobile: false },
    { name: 'TikTok', active: false, hideOnMobile: true },
    { name: 'Instagram', active: false, hideOnMobile: true },
  ]);
}
