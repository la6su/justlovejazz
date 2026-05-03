// src/Experience/Time.ts
export class Time {
    start: number = Date.now()
    elapsed: number = 0
    delta: number = 0

    update() {
        const currentTime = Date.now()
        this.delta = currentTime - this.start
        this.start = currentTime
        this.elapsed += this.delta / 1000
    }
}