import { Component } from '@angular/core';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators'

@Component({
  selector: 'app-hot-n-cold-demo',
  template: `
    <p>Result :</p>
    <p *ngFor="let line of result">{{line}}</p>
  `
})
export class HotNColdDemoComponent {
  result: string[] = [];

  run() {

  }

  private _append(val: string) {
    this.result = [...this.result, val]
  }
}