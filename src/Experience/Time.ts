// src/Experience/Time.ts
export class Time {
    start: number = performance.now()
    elapsed: number = 0
    delta: number = 0

    update(timestamp?: number) {
        const currentTime = timestamp ?? performance.now()
        this.delta = Math.min(Math.max(currentTime - this.start, 0), 100)
        this.start = currentTime
        this.elapsed += this.delta / 1000
    }
}
