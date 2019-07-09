import { Component } from '@angular/core';

import { routes } from './routes';

@Component({
  selector: 'my-app',
  template: `
    <nav style="background: whitesmoke; padding: 1rem; margin-bottom: 1rem;">
      <a *ngFor="let link of links" [routerLink]="link" style="margin-right: .5rem;">{{link}}</a>
    </nav>
    <router-outlet></router-outlet>
  `
})
export class AppComponent  {
  links = routes.reduce((acc, route) => [...acc, ...(route.path ? [route.path] : [])], [])
}
