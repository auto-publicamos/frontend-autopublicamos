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
    { name: 'Canva', active: true },
    { name: 'TikTok', active: false },
    { name: 'Instagram', active: false },
  ]);
}
