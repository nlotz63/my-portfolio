import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'example01', loadComponent: () => import('./interactive01/interactive01').then(m => m.Interactive01), title: 'Example 01'
    },
    {
        path: 'interactive04', loadComponent: () => import( './interactive04/interactive04.component').then(m => m.Interactive04Component), title: 'Example 04'
    },
    {
        path: 'yieldcurve', loadComponent: () => import('./interactive16/interactive16.component').then(m => m.Interactive16Component), title: '   Yield Curve'
    },
    {
        path: '', redirectTo: 'yieldcurve', pathMatch: 'full'
    }
];
