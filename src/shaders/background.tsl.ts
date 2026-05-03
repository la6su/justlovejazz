import {
    color,
    sin,
    cos,
    time,
    uv,
    add,
    mul,
    float
} from 'three/tsl'

export const backgroundNode = () => {
    // В некоторых сборках time/uv - это функции, в некоторых - константы.
    // Чтобы быть на 100% уверенными, проверяем тип.
    const t = typeof time === 'function' ? time() : time
    const u = typeof uv === 'function' ? uv() : uv

    // wave1 = sin(u.x * 3 + t * 0.5) + sin(u.y * 2 + t * 0.3)
    const wave1 = add(
        sin(add(mul(u.x, 3), mul(t, 0.5))),
        sin(add(mul(u.y, 2), mul(t, 0.3)))
    )

    // wave2 = cos(u.y * 4 + t * 0.4) + cos(u.x * 3 + t * 0.6)
    const wave2 = add(
        cos(add(mul(u.y, 4), mul(t, 0.4))),
        cos(add(mul(u.x, 3), mul(t, 0.6)))
    )

    const colorA = color(0.05, 0.1, 0.2)
    const colorB = color(0.2, 0.05, 0.3)
    const colorC = color(0.0, 0.4, 0.4)

    // finalColor = colorA + colorB * (wave1 + 1) * 0.5 + colorC * (wave2 + 1) * 0.5
    const finalColor = add(
        colorA,
        add(
            mul(colorB, mul(add(wave1, float(1)), float(0.5))),
            mul(colorC, mul(add(wave2, float(1)), float(0.5)))
        )
    )

    return finalColor
}