import {
    color,
    sin,
    cos,
    time,
    uv,
    add,
    mul,
    float,
    mix,
    fract,
    vec2
} from 'three/tsl'

export const backgroundNode = () => {
    const t = typeof time === 'function' ? time() : time
    const u = typeof uv === 'function' ? uv() : uv

    // Вспомогательная функция для создания псевдо-шума
    const organicNoise = (p: any, speed: any) => {
        // x = p.x  2.0 + t  speed
        const x = add(mul(p.x, float(2.0)), mul(t, speed))
        // y = p.y  2.0 + t  (speed * 0.8)
        const y = add(mul(p.y, float(2.0)), mul(t, mul(speed, float(0.8))))

        return add(
            sin(x),
            sin(add(y, sin(x)))
        )
    }

    // --- Domain Warping ---
    // 1. Первый слой искажения
    const warp1 = organicNoise(u, float(0.3))
    const offset1 = vec2(mul(warp1, float(0.1)), mul(warp1, float(0.1)))

    // 2. Второй слой, который читает координаты, смещенные первым слоем
    const warpedUv = add(u, offset1)
    const warp2 = organicNoise(warpedUv, 0.5)

    // 3. Финальный коэффициент интенсивности (от 0 до 1)
    const intensity = mul(add(warp2, float(1.0)), float(0.5))

    // --- Цветовая палитра (Deep AI / Cyberpunk) ---
    // Глубокий темно-синий/черный
    const colorDeep = color(0.02, 0.02, 0.05)
    // Неоновый фиолетовый / Индиго
    const colorNeon = color(0.4, 0.1, 0.7)
    // Бирюзовый / Циан (для акцентов)
    const colorAccent = color(0.0, 0.8, 0.8)

    // Смешиваем цвета на основе интенсивности и времени
    // Создаем пульсирующий переход между неоном и акцентом
    const colorShift = sin(add(t,  0.2, 0.0))
    const dynamicColor = mix(colorNeon, colorAccent, add(intensity, mul(colorShift, 0.2)))

    // Итоговый цвет: база + динамический цвет, модулированный интенсивностью
    const finalColor = add(
        colorDeep,
        mul(dynamicColor, intensity)
    )

    return finalColor
}