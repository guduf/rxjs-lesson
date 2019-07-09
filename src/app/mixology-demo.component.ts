import { Component } from '@angular/core'
import {
  BehaviorSubject,
  combineLatest,
  EMPTY,
  interval,
  of,
  Observable,
  throwError,
  Subject,
  timer
} from 'rxjs'
import {
  catchError,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  mergeMap,
  map,
  retryWhen,
  scan,
  share,
  skip,
  startWith,
  takeUntil,
  take,
  tap
} from 'rxjs/operators'

type StockItem = '🌾' | '🍇' | '🍎' | '🍋' | '🥃'
type Stock = { [item in StockItem]?: number }
const STOCK_ITEMS: StockItem[] = ['🌾', '🍇', '🍎', '🍋', '🥃']
const PURCHASE_DELAY = 5 * 1000
const ORDER_DELAY = 2.5 * 1000

type Beverage = '🍺' | '🍹' | '🍷' | '🥤'
const BEVERAGES: { [b in Beverage]: Stock } = {
  '🍺' : {'🌾': 2},
  '🍹': {'🥃': 1, '🍋': 1},
  '🍷' : {'🍇': 1},
  '🥤': {'🍎': 2}
}

@Component({
  selector: 'app-mixology-demo',
  template: `
    <p>Purchases:</p>
    <button type="button" *ngFor="let item of stockItems" (click)="purchases.next(item)">
      {{item}} {{nextItemStock[item] | async}}
    </button>
    <p>{{purchaseTimerMessage | async}}</p>
    <p>Stock:</p>
    <span *ngFor="let item of stock | async | keyvalue" (click)="purchases.next(item)">
      {{item.key}} {{item.value}}
    </span>
    <p>Beverages:</p>
    <button type="button" *ngFor="let beverage of bevegages" (click)="orders.next(beverage)">
      {{beverage}}
    </button>
    <p>Queue:</p>
    <span *ngFor="let beverage of orderQueue | async">{{beverage}}</span>
    <p>Progress:</p>
    <div style="height: 1rem; background: whitesmoke">
      <div style="height: 1rem; background: grey" [style.maxWidth.%]="orderProgress | async">
    </div>
  `
})
export class MixologyDemoComponent {
  readonly stockItems = STOCK_ITEMS

  readonly bevegages = Object.keys(BEVERAGES) as Beverage[]

  readonly purchases = new Subject<StockItem>()

  readonly purchaseTimer = interval(PURCHASE_DELAY).pipe(startWith(-1))

  readonly nextStock = this.purchaseTimer.pipe(
    mergeMap(() => (
      this.purchases.pipe(
        takeUntil(this.purchaseTimer.pipe(skip(1))),
        scan((acc, item) => ({
          ...acc,
          [item]: (acc[item] || 0) + 1}
        ), {} as { [key in StockItem]: number }),
        startWith({})
      )
    )),
    share()
  )

  readonly nextItemStock = STOCK_ITEMS.reduce((acc, item) => ({
    ...acc,
    [item]: this.nextStock.pipe(
      map(nextStock => nextStock[item] || 0),
      startWith(0),
      distinctUntilChanged()
    )
  }), {} as { [key in StockItem]: Observable<number> })


  readonly purchaseTimerMessage = this.purchaseTimer.pipe(
    mergeMap(round => (
      interval(1000).pipe(
        startWith(-1),
        take((PURCHASE_DELAY / 1000)),
        map(i => `${(PURCHASE_DELAY / 1000) - (i + 1)} seconds before purchase #${round + 1}`)
      )
    ))
  )

  readonly stock = new BehaviorSubject<Stock>({})

  readonly purchasesSubscr = combineLatest(this.purchaseTimer, this.nextStock).pipe(
    distinctUntilKeyChanged('0'),
    map(([, nextStock]) => nextStock),
    map((nextStock: Stock) => (
      Object.keys(nextStock).reduce((subAcc, item) => ({
        ...subAcc,
        [item]: (this.stock.value[item] || 0) + nextStock[item] 
      }), this.stock.value)
    ))
  ).subscribe(this.stock)

  readonly orders = new Subject<Beverage>()

  readonly orderQueue = new BehaviorSubject<Beverage[]>([])

  readonly orderTimer = interval(ORDER_DELAY)

  readonly orderProgress = this.orderTimer.pipe(
    startWith(),
    mergeMap(() => (
      interval(100).pipe(
        take(ORDER_DELAY / 100),
        map(i => this.orderQueue.value.length ? (i * 10000 / ORDER_DELAY) : 0)
      )
    ))
  )

  readonly orderQueueSubscr = this.orders.subscribe(
    beverage => this.orderQueue.next([...this.orderQueue.value, beverage])
  )

  readonly orderSubscr = this.orderTimer.pipe(
    mergeMap(() => {
      const beverage = this.orderQueue.value[0]
      if (!beverage) return EMPTY
      const hasStock = Object.keys(BEVERAGES[beverage]).reduce((acc, item) => (
        acc && this.stock.value[item] >= BEVERAGES[beverage][item]
      ), true)
      if (!hasStock){
        console.error(new Error(`Insufficient stock for '${beverage}'`))
        return EMPTY
      }
      return of(BEVERAGES[beverage])
    })
  ).subscribe(
    recipe => {
      this.stock.next(Object.keys(recipe).reduce((acc, item) => ({
        ...acc,
        [item]: this.stock.value[item] - recipe[item]
      }), this.stock.value))
      this.orderQueue.next(this.orderQueue.value.slice(1))
    },
    err => console.error(err)
  )

  ngOnDestroy() {
    this.purchasesSubscr.unsubscribe()
    this.orderQueueSubscr.unsubscribe()
    this.orderSubscr.unsubscribe()
  }
}