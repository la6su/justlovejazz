# Specification: AI Design Studio Portfolio

## 1. Технический стек
- **Язык:** TypeScript
- **3D Engine:** Three.js (Latest version)
- **Shading:** TSL (Three.js Shading Language) / NodeMaterial
- **Rendering API:** WebGPU (Primary) $\rightarrow$ WebGL 2.0 (Fallback)
- **UI Framework:** UIkit 3 (YOOtheme)
- **Build Tool:** Vite

## 2. Функциональные требования

### 2.1 3D Слой (Background)
- **Поведение:** Полноэкранный канвас `position: fixed; z-index: -1`.
- **Визуал:** Процедурный фон на TSL (например, градиентные потоки, частицы или абстрактная сетка), создающий ощущение "AI/Digital".
- **Интерактив:**
    - Параллакс-эффект при движении курсора.
    - Реакция на скролл (изменение параметров шейдера).
- **Центральный объект:** GLTF модель в центре экрана с плавным вращением.

### 2.2 UI Слой (Frontend)
- **Концепция:** Mobile-first, минимализм.
- **Структура:**
    - Header (Навигация).
    - Hero section (Заголовок + CTA).
    - Portfolio/Cases (Сетка проектов).
    - About/AI-Approach (Текстовый блок).
    - Contact form.
- **Стиль:** Glassmorphism (размытие фона через `backdrop-filter: blur`), чтобы 3D слой просвечивал сквозь интерфейс.

## 3. Технические ограничения и требования

### 3.1 Performance (Mobile First)
- **LOD (Level of Detail):** Снижение качества шейдеров или упрощение геометрии на мобильных устройствах.
- **FPS:** Целевой показатель 60 FPS.
- **Memory:** Очистка памяти (Dispose) при смене сцен или объектов.

### 3.2 WebGPU/WebGL Fallback
- Проверка поддержки `navigator.gpu`.
- Если WebGPU недоступен $\rightarrow$ инициализация `WebGLRenderer`.
- Использование NodeMaterial для обеспечения кросс-платформенности шейдеров.

## 4. Критерии приемки
- Сайт открывается и работает на iOS/Android и Desktop.
- 3D фон не перекрывает взаимодействие с UI элементами.
- Время первой отрисовки (FCP) в пределах 2 секунд.
- Отсутствие визуальных артефактов при изменении размера окна.