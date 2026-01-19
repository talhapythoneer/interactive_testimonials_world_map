# World Reviews Map 🌍

An interactive, embeddable world map that displays client reviews by country. When users hover over a highlighted country, they see scrolling testimonials from clients in that region — perfect for portfolios, agency websites, and SaaS landing pages.

## ✨ Features

- **Interactive World Map** — Zoomable, pannable D3.js-powered map
- **Hover Tooltips** — Country-specific reviews scroll in a sleek tooltip
- **Mobile Friendly** — Touch support with responsive design
- **Easy to Embed** — Drop into any website without affecting existing styles
- **CSV Data Source** — Simple CSV file for easy updates
- **Customizable** — Toggle legend, stats, zoom controls
- **Lightweight** — No heavy frameworks required

## 🚀 Quick Start

### 1. Include Dependencies

Add D3.js and TopoJSON to your page:

```html
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="https://unpkg.com/topojson@3"></script>
```

### 2. Include World Reviews Map

```html
<link rel="stylesheet" href="dist/world-reviews-map.css">
<script src="dist/world-reviews-map.js"></script>
```

### 3. Add Container & Initialize

```html
<div id="world-reviews-map"></div>

<script>
  const map = new WorldReviewsMap({
    containerId: 'world-reviews-map',
    reviewsPath: 'data/reviews.csv'
  });
</script>
```

That's it! 🎉

## 📁 Project Structure

```
world-reviews-map/
├── dist/
│   ├── world-reviews-map.css    # Component styles
│   └── world-reviews-map.js     # Main JavaScript
├── data/
│   └── reviews.sample.csv       # Sample data template
├── index.html                   # Demo page
└── README.md
```

## 📊 CSV Data Format

Create a `reviews.csv` file with the following columns:

| Column | Required | Description |
|--------|----------|-------------|
| `comment` | Yes | The review text |
| `reviewer_country` | Yes | Full country name (e.g., "United States") |
| `reviewer_country_code` | Yes | ISO 2-letter code (e.g., "US") |
| `username` | Yes | Reviewer's display name |
| `reviewer_industry` | No | Industry category (e.g., "technology") |
| `user_image_url` | No | URL to reviewer's avatar image |

### Example CSV

```csv
comment,reviewer_country,reviewer_country_code,reviewer_industry,user_image_url,username
"Excellent work! Highly recommended.",United States,US,technology,,john_dev
"Professional and responsive.",United Kingdom,GB,marketing,,sarah_uk
"Great communication throughout.",Germany,DE,technology,,mueller_tech
```

### Supported Country Codes

The map supports all standard ISO 3166-1 alpha-2 country codes. Common examples: US, GB, DE, FR, CA, AU, IN, JP, BR, NL, etc.

[Full list of country codes](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)

## ⚙️ Configuration Options

```javascript
const map = new WorldReviewsMap({
  // Required
  containerId: 'world-reviews-map',  // ID of container element
  
  // Optional
  reviewsPath: 'data/reviews.csv',   // Path to your CSV file
  showLegend: true,                  // Show/hide legend
  showStats: true,                   // Show/hide country & review counts
  showZoomControls: true             // Show/hide zoom buttons
});
```

## 🎨 Styling

All CSS classes are prefixed with `wrm-` to avoid conflicts with your site's styles.

## 📱 Responsive Behavior

- **Desktop**: Tooltip follows cursor
- **Tablet/Mobile**: Tooltip fixed at bottom center, tap to show/hide

## 🔧 Methods

```javascript
// Refresh data (e.g., after updating CSV)
map.refresh();

// Clean up (remove tooltip, clear container)
map.destroy();
```

## 🌐 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📄 License

MIT License — free for personal and commercial use.

## 💡 Use Cases

- **Portfolio Websites** — Show your global client reach
- **Agency Sites** — Display testimonials by region
- **SaaS Landing Pages** — Highlight customer distribution
- **Consulting Firms** — Visualize international presence
- **E-commerce** — Show customer reviews by country

## 🙏 Credits

- Map data: [Natural Earth](https://www.naturalearthdata.com/) via [world-atlas](https://github.com/topojson/world-atlas)
- Visualization: [D3.js](https://d3js.org/)
- TopoJSON: [topojson](https://github.com/topojson/topojson)

---

Made with ❤️ for the global community
