import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { AsyncDemoComponent } from './async-demo.component';
import { BasicDemoComponent } from './basic-demo.component';
import { MixologyDemoComponent } from './mixology-demo.component';
import { TypeDemoComponent } from './type-demo.component';
import { routes } from './routes';

@NgModule({
  imports:      [BrowserModule, FormsModule, RouterModule.forRoot(routes)],
  declarations: [
    AppComponent,
    AsyncDemoComponent,
    BasicDemoComponent,
    MixologyDemoComponent,
    TypeDemoComponent
  ],
  bootstrap:    [AppComponent]
})
export class AppModule { }
