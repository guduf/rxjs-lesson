
import { Routes, RouterModule } from '@angular/router';
import { AsyncDemoComponent } from './async-demo.component';
import { BasicDemoComponent } from './basic-demo.component';
import { HotNColdDemoComponent } from './hot-n-cold-demo.component';
import { MixologyDemoComponent } from './mixology-demo.component';
import { TypeDemoComponent } from './type-demo.component';

export const routes: Routes = [
  {path: 'basic', component: BasicDemoComponent},
  {path: 'type', component: TypeDemoComponent},
  {path: 'mixology', component: MixologyDemoComponent},
  {path: 'hot-n-cold', component: HotNColdDemoComponent},
  {path: 'async', component: AsyncDemoComponent},
  {path: '', redirectTo: '/basic', pathMatch: 'full'}
];