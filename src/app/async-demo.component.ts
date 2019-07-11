import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators'

const SYMBOLS = {
  '𝓣': resolve => { setTimeout(resolve) },
  '𝓟': resolve => { Promise.resolve('𝓟' as Symbol).then(resolve) },
  '𝓞': resolve => { of(null).subscribe(() => resolve()) },
  '𝓓': resolve => { of(null).pipe(delay(0)).subscribe(() => resolve()) },
  '𝓢': resolve => { resolve() }
}

type Symbol = keyof typeof SYMBOLS

@Component({
  selector: 'app-async-demo',
  template: `
    <p>Bet Form :</p>
    <div>
      <input [formControl]="betFormGroup.get('name')" placeholder="Name"/>
      <button
      type="button"
      *ngFor="let symbol of symbols"
      (click)="toggleSymbol(symbol)"
      [style.background]="isActive(symbol) ? 'grey' : 'whitesmoke'">
        {{symbol}}
      </button>
      <button type="button" (click)="addBet()" [disabled]="betFormGroup.invalid">Save</button>
    </div>
    <p>Bets :</p>
    <ul>
      <li *ngFor="let bet of bets | keyvalue">
        {{bet.key}}:
        <span *ngFor="let symbol of bet.value; let i = index" [style.color]="getResultColor(symbol, i)">
          {{symbol}}
        </span>
      </li>
    </ul>
    <button type="button" (click)="run()">Run</button>
    <button type="button" (click)="reset()">Reset</button>
  `
})
export class AsyncDemoComponent {
  bets: { [name: string]: Symbol[] }

  symbols = Object.keys(SYMBOLS)

  results: Symbol[] = []

  betFormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
    symbols: new FormControl([], c => c.value && c.value.length === 5 ? null : {size: true})
  })

  addBet(): void {
    if (this.betFormGroup.invalid) return;
    const {name, symbols} = this.betFormGroup.value
    this.bets = {...this.bets, [name]: symbols}
    this.betFormGroup.setValue({name: '', symbols: []})
  }

  toggleSymbol(symbol: Symbol): void {
    const symbolsValue = this.betFormGroup.get('symbols').value as Symbol[]
    if (this.isActive(symbol)) {
      const i = symbolsValue.indexOf(symbol)
      this.betFormGroup.get('symbols').setValue([
        ...symbolsValue.slice(0 , i),
        ...symbolsValue.slice(i + 1)
      ])
      return
    }
    if (symbolsValue.length > Object.keys(SYMBOLS).length - 1) return
    this.betFormGroup.get('symbols').setValue([...symbolsValue, symbol])
  }

  isActive(symbol: Symbol): boolean {
    return (this.betFormGroup.get('symbols').value as Symbol[]).indexOf(symbol) >= 0
  }

  getResultColor(symbol: Symbol, i: number): string {
    if (!this.results[i]) return 'black'
    return this.results[i] === symbol ? 'green' : 'red'
  }

  reset(): void {
    this.results = []
    this.bets = {}
  }

  run(): void {
    Object.keys(SYMBOLS).forEach((symbol) => (
      SYMBOLS[symbol](() => this.results = [...this.results, symbol] as Symbol[])
    ))
  }
}