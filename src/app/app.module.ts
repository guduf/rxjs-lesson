import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { AsyncDemoComponent } from './async-demo.component';
import { BasicDemoComponent } from './basic-demo.component';
import { HotNColdDemoComponent } from './hot-n-cold-demo.component';
import { OperatorsDemoComponent } from './operators-demo.component';
import { TypeDemoComponent } from './type-demo.component';
import { routes } from './routes';

@NgModule({
  imports: [BrowserModule, ReactiveFormsModule, RouterModule.forRoot(routes)],
  declarations: [
    AppComponent,
    AsyncDemoComponent,
    BasicDemoComponent,
    HotNColdDemoComponent,
    OperatorsDemoComponent,
    TypeDemoComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
