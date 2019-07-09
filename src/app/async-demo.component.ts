import { Component } from '@angular/core';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators'

@Component({
  selector: 'app-async-demo',
  template: `
    <button type="button" (click)="run()">Run</button>
    <p>Result :</p>
    <p *ngFor="let line of result">{{line}}</p>
  `
})
export class AsyncDemoComponent {
  result: string[] = [];

  run() {
    this.result = [];
    setTimeout(() => this._append('🍑'))
    Promise.resolve('🍌').then(e => this._append(e));
    of('🍐').subscribe(e => this._append(e));
    of('🍓').pipe(delay(0)).subscribe(e => this._append(e));
    this._append('🍎');
  }

  private _append(val: string) {
    this.result = [...this.result, val]
  }
}