import { Component } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { delay, tap } from 'rxjs/operators'

@Component({
  selector: 'app-basic-demo',
  template: `
    <button type="button" (click)="runActionWithCallback()">Callback</button>
    <button type="button" (click)="runActionWithPromise()">Promise</button>
    <button type="button" (click)="runActionWithObservableFromPromise()">Observable from promise</button>
    <button type="button" (click)="runActionWithObservable()">Observable</button>
    <p>Result :</p>
    <p *ngFor="let line of result">{{line}}</p>
  `
})
export class BasicDemoComponent {
  result: string[];

  runActionWithCallback() {
    this.result = [];
    this._actionWithCallback((err, result) => {
      if (err) console.error(err)
      else console.log(result)
    })
  }

  runActionWithPromise() {
    this.result = [];
    this._actionWithPromise().then(
      result => console.log(result),
      err => console.error(err)
    )
  }

  runActionWithObservableFromPromise() {
    this.result = [];
    this._actionWithObservableFromPromise().subscribe(
      result => console.log(result),
      err => console.error(err)
    )
  }

  runActionWithObservable() {
    this.result = [];
    this._actionWithObservable().subscribe(
      result => console.log(result),
      err => console.error(err)
    )
  }

  private _append(type: 'start' | 'end', action: string) {
    this.result = [...this.result, `${type === 'start' ? '⚑' : '⚐'} ${action}`];
  }

  private _actionWithCallback(cb: (err?: Error, result?: boolean) => void): void {
    this._append('start', 'callback');
    setTimeout(() => {
      cb(null, true);
      this._append('end', 'callback')
    }, 1000);
  }

  private _actionWithPromise(): Promise<boolean> {
    this._append('start', 'promise');
    return new Promise((resolve, reject) => 
      this._actionWithCallback((err, result) => {
        if (err) reject(err)
        else resolve(result)
        this._append('end', 'promise')
      })
    )
  }

  private _actionWithObservableFromPromise(): Observable<boolean> {
    this._append('start', 'observable from promise');
    return from(this._actionWithPromise()).pipe(tap(() => this._append('end', 'observable from promise')))
  }

  private _actionWithObservable(): Observable<boolean> {
    this._append('start', 'observable');
    return of(true).pipe(delay(1000), tap(() => this._append('end', 'observable')))
  }
}