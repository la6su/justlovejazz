# SYSTEM.md

## Studio Constitution

Этот документ фиксирует системную архитектуру студии. Он определяет, как студия мыслит, производит и оценивает результат.

SYSTEM.md не является маркетингом. Это рабочая конституция.

## 1. Назначение

Студия проектирует и производит визуальные системы:

- digital experiences;
- portfolio/showcase systems;
- интерактивные сцены;
- дизайн-системы;
- experimental visual tools.

Результат студии — не страница и не эффект, а управляемая система восприятия.

## 2. Core Domain

Core domain: **Design Production**.

Он описывает:

- как появляется намерение;
- как проводится research;
- как формируется concept;
- как система производится;
- как качество проверяется;
- как результат публикуется и развивается.

## 3. Bounded Contexts

### Design Production

Главный контекст. Отвечает за замысел, структуру, визуальную целостность и критерии качества.

### Studio Identity

Фиксирует язык, принципы, тон, типографику, композицию и допустимые визуальные приёмы.

### Interactive Technology

Отвечает за WebGL/WebGPU, Three.js, shaders, render pipeline, asset lifecycle и performance.

### Portfolio & Showcase

Публичная интерпретация проектов. Ничего не придумывает заново, а точно показывает систему.

### Client & Business

Клиенты, статусы, коммерческие ограничения, delivery.

### AI / CG Pipelines

Генерация, ассеты, automation, procedural workflows. Интегрируется через понятные interfaces.

## 4. Lifecycle

Каждый проект проходит стадии:

1. Intent
2. Research
3. Concept
4. System Design
5. Production
6. Refinement
7. QA
8. Release
9. Archive / Evolution

Стадии можно сжимать, но нельзя пропускать концептуально.

## 5. Quality Principles

- Ясность важнее эффектности.
- Система важнее формы.
- Движение должно иметь причину.
- Performance является частью дизайна.
- Accessibility является частью production.
- Документация считается артефактом.
- Нельзя объявлять готовность без проверки.

## 6. Engineering Principles

- KISS перед абстракцией.
- SOLID там, где есть реальные границы ответственности.
- State-driven UI/WebGL.
- Один источник правды для section/world state.
- Assets имеют lifecycle.
- Render pipeline измеряется, а не угадывается.
- Fallback проектируется заранее.

## 7. Roles

Роль — функция, не должность.

- Design Lead — визуальный язык.
- System Architect — целостность системы.
- Technologist — runtime, shaders, performance.
- Producer — стадии, scope, release.
- Researcher — контекст и концепты.
- QA Reviewer — проверка качества, regressions, accessibility.

## 8. Production Bar

Проект готов к публикации только если:

- build проходит;
- performance измерен;
- fallback определён;
- mobile проверен отдельно;
- accessibility baseline выполнен;
- motion review пройден;
- документация соответствует реальности.

## Финальное Правило

Студия — это система.
Эффекты, страницы и технологии являются её проявлениями.
