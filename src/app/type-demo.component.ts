import { Component, OnDestroy } from '@angular/core'
import { Observer, Observable, Subject, Subscriber , Subscription, of, from, interval } from 'rxjs'
import { delay, take, tap, map, mergeMap } from 'rxjs/operators'

interface FruitEvent {
  fruit: string
}

const INITIAL_BASKET = ['🍎', '🍐', '🍋']
const DELAY = 1000

@Component({
  selector: 'app-type-demo',
  template: `
    <button type="button" (click)="runObservable()">Run observable</button>
    <button type="button" (click)="runInterval()">Run interval</button>
    <button type="button" (click)="runFromIterable()">Run from iterable</button>
    <p>Result :</p>
    <p *ngFor="let line of result">{{line}}</p>
  `
})
export class TypeDemoComponent implements OnDestroy {
  result: string[] = []

  readonly observer: Observer<FruitEvent> = {
    next: e => this._append(e.fruit),
    error: err => this._append(`❗️ ️${err.message}`),
    complete: () => this._append('🔚')
  }

  readonly observable: Observable<FruitEvent> = new Observable(subscriber => {
    const timer = this._runProcess(subscriber)
    return () => this._teardown(timer)
  })

  private _subscr: Subscription

  ngOnDestroy(): void {
    if (this._subscr) {
      this._subscr.unsubscribe()
    }
  }

  runObservable(): void {
    if (this._subscr) {
      this._subscr.unsubscribe()
    }
    this.result = [];
    this._subscr = this.observable.subscribe(
      e => this.observer.next(e),
      err => this.observer.error(err),
      () => this.observer.complete()
    )
  }

  runInterval(): void {
    if (this._subscr) {
      this._subscr.unsubscribe()
    }
    this.result = [];
    this._subscr = interval(DELAY).pipe(
      take(INITIAL_BASKET.length),
      map((_, i) => ({fruit: INITIAL_BASKET[i]}))
    ).subscribe(this.observer)
  }

  runFromIterable(): void {
    if (this._subscr) {
      this._subscr.unsubscribe()
    }
    this.result = [];
    this._subscr = from(INITIAL_BASKET).pipe(
      mergeMap((_, i) => of({fruit: INITIAL_BASKET[i]}).pipe(delay((i + 1) * 1000))),
      take(INITIAL_BASKET.length)
    ).subscribe(this.observer)
  }

  private _append(val: string) {
    this.result = [...this.result, val]
  }

  private _runProcess(subscriber: Subscriber<FruitEvent>): number {
    const basket = INITIAL_BASKET;
    return setInterval(() => {
      const fruit = basket.splice(0, 1)[0]
      if (['🍎', '🍐', '🍋'].indexOf(fruit) < 0) {
        subscriber.error(new TypeError(`'${fruit}' is not a fruit`))
        return
      }
      subscriber.next({fruit})
      if (!basket.length) {
        subscriber.complete()
      }
    }, DELAY)
  }

  private _teardown(timerId: number): void {
    clearInterval(timerId)
  }
}