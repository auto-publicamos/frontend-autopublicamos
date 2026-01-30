import { Routes } from '@angular/router';
import { canvaAuthGuard } from './guards/canva-auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'main',
    pathMatch: 'full',
  },
  {
    path: 'main',
    loadComponent: () => import('./modules/main/main').then((m) => m.Main),
    children: [
      {
        path: '',
        redirectTo: 'canva',
        pathMatch: 'full',
      },
      {
        path: 'canva',
        children: [
          {
            path: '',
            loadComponent: () => import('./modules/main/content/canva/canva').then((m) => m.Canva),
            data: { template: null },
          },
          {
            path: 'single',
            loadComponent: () => import('./modules/main/content/canva/canva').then((m) => m.Canva),
            data: { template: 'single' },
            canActivate: [canvaAuthGuard],
          },
          {
            path: 'double',
            loadComponent: () => import('./modules/main/content/canva/canva').then((m) => m.Canva),
            data: { template: 'double' },
            canActivate: [canvaAuthGuard],
          },
        ],
      },
      {
        path: 'instagram',
        loadComponent: () =>
          import('./modules/main/content/instagram/instagram').then((m) => m.Instagram),
      },
      {
        path: 'tiktok',
        loadComponent: () => import('./modules/main/content/tiktok/tiktok').then((m) => m.Tiktok),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'main',
    pathMatch: 'full',
  },
];
