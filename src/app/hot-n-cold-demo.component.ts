import { ChangeDetectorRef, Component } from '@angular/core'
import { from, Observable } from 'rxjs'
import { map, mergeMap, scan, startWith, tap } from 'rxjs/operators'
import faker from 'faker'

const ESCAPE_DELAY = 1000
const ESCAPE_RATE = 1 / 2
const BRING_BACK_DELAY = 5000

const SPECIES = ['🐯', '🐵', '🦓', '🦁'] as ['🐯', '🐵', '🦓', '🦁']
type Species = typeof SPECIES[number]

const GENDERS = ['♂️', '♀️'] as ['♂️', '♀️']
type Gender = typeof GENDERS[number]

type Animal = { species: Species, name: string, gender: Gender }

const ANIMALS: Animal[] = Array.from({length: 20}, () => ({
  species: SPECIES[faker.random.number({min: 0, max: SPECIES.length - 1})],
  name: faker.name.firstName(1),
  gender: GENDERS[faker.random.number({min: 0, max: GENDERS.length - 1})]
}))

export type EscapeHandler = (animal: Animal) => boolean

export class Zoo {
  animals = ANIMALS

  get broken(): boolean {
    return Boolean(this._timerId)
  }

  private _timerId: number
  private _handlers: EscapeHandler[] = []

  breakFences() {
    if (typeof this._timerId === 'number') clearInterval(this._timerId)
    this._timerId = setInterval(() => {
      if (Math.random() > ESCAPE_RATE || !this.animals.length) return
      const i = faker.random.number({min: 0, max: this.animals.length - 1})
      const animal = this.animals.splice(i, 1)[0]
      console.info(`${animal.name} (${animal.species}${animal.gender}) has escaped !`)
      this._handlers.reduce((acc, handler) => acc || handler(animal), false)
    }, ESCAPE_DELAY)
  }

  repairFences() {
    if (typeof this._timerId !== 'number') return
    clearInterval(this._timerId)
    this._timerId = null
  }

  addEscapeHandler(handler: EscapeHandler): void {
    this._handlers = [...this._handlers, handler]
  }

  removeEscapeHandler(handler: EscapeHandler): void {
    const i = this._handlers.indexOf(handler)
    if (i < 0) return
    this._handlers = [...this._handlers.slice(0, i), ...this._handlers.slice(i + 1)]
  }

  bringBackAnimal(animal: Animal): void {
    this.animals = [...this.animals, animal]
      console.info(`${animal.name} (${animal.species}${animal.gender}) has been brought back !`)
  }
}

export class ZooKeeper extends Observable<Animal> {
  readonly name = `${faker.name.firstName()} ${faker.name.lastName()}`
  
  target: Animal

  constructor(zoo: Zoo) {
    super(subscriber => {
      const handler = (animal: Animal) => {
        const handled = this._handleEscape(animal)
        if (handled) {
          subscriber.next(this.target)
          setTimeout(() => {
            zoo.bringBackAnimal(this.target)
            subscriber.next(this.target = null)
          }, BRING_BACK_DELAY)
        }
        return handled
      }
      zoo.addEscapeHandler(handler)
      return () => zoo.removeEscapeHandler(handler)
    })
  }

  private _handleEscape(animal: Animal): boolean {
    if (this.target) return false
    this.target = animal
    return true
  }
}

@Component({
  selector: 'app-hot-n-cold-demo',
  template: `
    <button type="button" *ngIf="!zoo.broken" (click)="zoo.breakFences()">Break fences</button>
    <button type="button" *ngIf="zoo.broken" (click)="zoo.repairFences()">Repair fences</button>
    <div style="float: left; margin-left: 40px">
      <p>Animals</p>
      <ul>
        <li *ngFor="let animal of zoo.animals">
          {{animal.name + ' (' + animal.species + animal.gender + ')'}}
        </li>
      </ul>
    </div>
    <div style="float: left; margin-left: 40px">
      <p>Keepers</p>
      <ul>
        <li *ngFor="let pair of keeperTargets | async | keyvalue">
        {{pair.key}}: {{pair.value ? pair.value.name + ' (' + pair.value.species + pair.value.gender + ')' : 'none'}}
        </li>
      </ul>
    </div>
  `
})
export class HotNColdDemoComponent {
  readonly zoo = new Zoo()
  readonly keepers = Array.from({length: 10}, () => new ZooKeeper(this.zoo))
  readonly keeperTargets = from(this.keepers).pipe(
    mergeMap((keeper: ZooKeeper) => keeper.pipe(startWith(null), map(target => ({[keeper.name]: target})))),
    scan((acc, pair) => ({...acc, ...pair}), {} as { [name: string]: Animal }),
    map(e => ({...e}))
  )

  ngOnDestroy() {
    this.zoo.repairFences()
  }
}