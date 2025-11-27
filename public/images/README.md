# Images Directory

This directory contains all images used in the course content.

## Structure

Organize images by level and lesson:
```
images/
├── a1/
│   ├── lesson1/
│   ├── lesson2/
│   └── ...
├── a2/
├── b1/
├── b2/
├── c1/
└── shared/  (for images used across multiple lessons)
```

## Usage in MDX

To use images in your MDX content, reference them with paths starting from `/images/`:

### Example 1: Simple Image
```mdx
![Description](/images/c1/lesson1/example.jpg)
```

### Example 2: Image with custom size
```mdx
<img src="/images/b1/lesson2/diagram.png" alt="Diagram" width="500" />
```

### Example 3: Using in Media component
```mdx
<Media src="/images/a2/lesson3/photo.jpg" alt="Example photo" />
```

## Supported Formats

- `.jpg`, `.jpeg` - Photos
- `.png` - Graphics with transparency
- `.svg` - Vector graphics
- `.webp` - Modern optimized format
- `.gif` - Animated images

## Best Practices

1. **Naming**: Use descriptive, lowercase names with hyphens
   - ✅ `german-grammar-table.png`
   - ❌ `IMG_1234.PNG`

2. **Size**: Optimize images before uploading
   - Max width: 1920px for full-width images
   - Max width: 800px for inline images
   - Use tools like TinyPNG or ImageOptim

3. **Format**:
   - Use `.webp` for best compression
   - Use `.png` for screenshots and diagrams
   - Use `.jpg` for photos
   - Use `.svg` for icons and simple graphics

4. **Organization**: Keep related images together
   - Group by lesson or topic
   - Use subdirectories for complex lessons

## Deployment

All files in `public/images/` are automatically:
- Copied to the build output during `npm run build`
- Deployed to GitHub Pages
- Accessible at `https://yourdomain.com/images/...`
