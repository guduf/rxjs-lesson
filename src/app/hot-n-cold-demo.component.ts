import { ChangeDetectorRef, Component } from '@angular/core'
import { from, Observable } from 'rxjs'
import { map, mergeMap, scan, startWith, tap } from 'rxjs/operators'
import faker from 'faker'

const ESCAPE_DELAY = 1000
const ESCAPE_RATE = 1 / 2
const BRING_BACK_DELAY = 5000
const BIRTH_DELAY = 5000

const SPECIES = ['🐯', '🐵', '🦓', '🦁'] as ['🐯', '🐵', '🦓', '🦁']
type Species = typeof SPECIES[number]

const GENDERS = ['♂️', '♀️'] as ['♂️', '♀️']
type Gender = typeof GENDERS[number]

type Animal = { species: Species, name: string, gender: Gender }


function getAnimalLabel({name, species, gender}: Animal): string {
  return `${name} (${species + gender})`
}

const ANIMALS: Animal[] = Array.from({length: 20}, () => ({
  species: SPECIES[faker.random.number({min: 0, max: SPECIES.length - 1})],
  name: faker.name.firstName(),
  gender: GENDERS[faker.random.number({min: 0, max: GENDERS.length - 1})]
}))

export type EscapeHandler = (animal: Animal) => boolean

export class Zoo {
  animals = ANIMALS

  private _nursery = false;

  get broken(): boolean {
    return Boolean(this._timerId)
  }

  get nursery(): boolean {
    return this._nursery
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

  addAnimal(animal: Animal): void {
    this.animals = [...this.animals, animal]
  }

  toggleNusery() {
    this._nursery = !this.nursery
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
            console.info(`${this.name} brought back ${getAnimalLabel(animal)}!`)
            zoo.addAnimal(this.target)
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

export class ZooNurse extends Observable<Animal> {
  readonly name = `${faker.name.firstName()} ${faker.name.lastName()}`

  constructor(readonly zoo: Zoo) {
    super(subscriber => {
      const timerId = setInterval(() => {
        if (!zoo.nursery) return
        const baby = this._makeBaby()
        if (baby) {
          this.zoo.addAnimal(baby)
          subscriber.next(baby)
        }
      }, BIRTH_DELAY)
      return () => clearInterval(timerId)
    })
  }

  private _makeBaby(): Animal | null {
    const species = this.zoo.animals.reduce((acc, animal) => ({
      ...acc,
      [animal.species]: [...(acc[animal.species] || []), animal]
    }), {} as { [key in Species]: Animal[] })
    const couple = shuffle(Object.keys(species)).reduce((couple, key) => {
      if (couple) return couple
      const animals = shuffle(species[key] as Animal[])
      const male = animals.find(animal => animal.gender === '♂️')
      const female = animals.find(animal => animal.gender === '♀️')
      return (male && female) ? {male, female} : null
    }, null as { male: Animal, female: Animal })
    if (!couple) return null;
    const baby = {
      species: couple.female.species,
      name: faker.name.firstName(),
      gender: GENDERS[faker.random.number({min: 0, max: GENDERS.length - 1})]
    }
    console.info(`${this.name} welcomes ${getAnimalLabel(baby)}, the baby of ${getAnimalLabel(couple.female)} and ${getAnimalLabel(couple.male)}`)
    return baby
  }
}

@Component({
  selector: 'app-hot-n-cold-demo',
  template: `
    <button type="button" *ngIf="!zoo.broken" (click)="zoo.breakFences()">Break fences</button>
    <button type="button" *ngIf="zoo.broken" (click)="zoo.repairFences()">Repair fences</button>
    <button type="button" (click)="zoo.toggleNusery()">{{zoo.nursery ? 'Close' : 'Open'}} Nursery</button>
    <div style="float: left; margin-left: 40px">
      <p>Animals</p>
      <ul>
        <li *ngFor="let animal of zoo.animals">{{getAnimalLabel(animal)}}</li>
      </ul>
    </div>
    <div style="float: left; margin-left: 40px">
      <p>Keepers</p>
      <ul>
        <li *ngFor="let pair of keepersTarget | async | keyvalue">
        {{pair.key}}: {{pair.value ? getAnimalLabel(pair.value) : 'none'}}
        </li>
      </ul>
    </div>
    <div style="float: left; margin-left: 40px">
      <p>Nurses</p>
      <ul>
        <li *ngFor="let pair of nursesLastBaby | async | keyvalue">
        {{pair.key}}: {{pair.value ? getAnimalLabel(pair.value) : 'none'}}
        </li>
      </ul>
    </div>
  `
})
export class HotNColdDemoComponent {
  readonly zoo = new Zoo()
  readonly keepers = Array.from({length: 10}, () => new ZooKeeper(this.zoo))
  readonly keepersTarget = from(this.keepers).pipe(
    mergeMap((keeper: ZooKeeper) => keeper.pipe(startWith(null), map(target => ({[keeper.name]: target})))),
    scan((acc, pair) => ({...acc, ...pair}), {} as { [name: string]: Animal }),
    map(e => ({...e}))
  )
  readonly nurses = Array.from({length: 3}, () => new ZooNurse(this.zoo))
  readonly nursesLastBaby = from(this.nurses).pipe(
    mergeMap((nurse: ZooNurse) => nurse.pipe(startWith(null), map(target => ({[nurse.name]: target})))),
    scan((acc, pair) => ({...acc, ...pair}), {} as { [name: string]: Animal }),
    map(e => ({...e}))
  )

  ngOnDestroy() {
    this.zoo.repairFences()
  }

  getAnimalLabel(animal: Animal): string {
    return getAnimalLabel(animal)
  }
}

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}