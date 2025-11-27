# Работа с изображениями

## Структура папок

Все изображения хранятся в `public/images/` с организацией по уровням:

```
public/images/
├── a1/          # Уровень A1
├── a2/          # Уровень A2
├── b1/          # Уровень B1
├── b2/          # Уровень B2
├── c1/          # Уровень C1
├── shared/      # Общие изображения
└── README.md    # Подробная документация
```

## Как добавить изображение

### 1. Поместите файл в нужную папку

Например, для урока C1:
```bash
public/images/c1/lesson1/grammar-table.png
```

### 2. Используйте в MDX файле

```mdx
# Мой урок

![Таблица грамматики](/images/c1/lesson1/grammar-table.png)
```

## Примеры использования

### Простое изображение
```mdx
![Описание](/images/b1/lesson2/example.jpg)
```

### Изображение с размером
```mdx
<img src="/images/a2/lesson3/diagram.png" alt="Диаграмма" width="500" />
```

### В компоненте Media
```mdx
<Media src="/images/c1/lesson1/photo.jpg" alt="Фото" />
```

### В Quiz
```mdx
<Quiz answer="1">
  Что изображено на картинке?
  
  <Option>
    <img src="/images/shared/apple.jpg" alt="Яблоко" width="150" />
    Яблоко
  </Option>
  <Option>
    <img src="/images/shared/banana.jpg" alt="Банан" width="150" />
    Банан
  </Option>
</Quiz>
```

## Рекомендации

### Форматы
- **JPG** - для фотографий
- **PNG** - для скриншотов и диаграмм
- **SVG** - для иконок и векторной графики
- **WebP** - для оптимизированных изображений

### Размеры
- Максимальная ширина: 1920px для полноэкранных
- Рекомендуемая ширина: 800px для встроенных
- Оптимизируйте перед загрузкой (TinyPNG, ImageOptim)

### Именование
- Используйте lowercase и дефисы: `grammar-table.png`
- Избегайте пробелов и спецсимволов
- Используйте описательные имена

## Деплой

При выполнении `npm run build`:
1. Vite копирует всё из `public/` в `dist/`
2. GitHub Actions деплоит `dist/` на GitHub Pages
3. Изображения доступны по адресу: `https://yourdomain.com/images/...`

## Локальная разработка

При запуске `npm run dev` изображения доступны по адресу:
```
http://localhost:5173/images/c1/lesson1/example.jpg
```

## Примеры

Смотрите файл `src/content/image-examples.mdx` для примеров использования.
