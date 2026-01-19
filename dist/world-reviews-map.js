/**
 * World Reviews Map v1.0.0
 * Interactive world map showing client reviews by country
 * https://github.com/yourusername/world-reviews-map
 * 
 * @license MIT
 */

class WorldReviewsMap {
  constructor(options = {}) {
    this.containerId = options.containerId || 'world-reviews-map';
    this.reviewsPath = options.reviewsPath || 'data/reviews.csv';
    this.showLegend = options.showLegend !== false;
    this.showStats = options.showStats !== false;
    this.showZoomControls = options.showZoomControls !== false;
    
    this.reviewsData = [];
    this.svg = null;
    this.g = null;
    this.projection = null;
    this.path = null;
    this.zoom = null;
    this.tooltip = null;
    this.width = 0;
    this.height = 0;
    
    this.init();
  }

  async init() {
    this.showLoading();
    await this.loadReviews();
    this.setupDimensions();
    this.createSVG();
    this.createTooltip();
    if (this.showZoomControls) this.createZoomControls();
    await this.drawMap();
    if (this.showStats) this.updateStats();
    this.hideLoading();
  }

  showLoading() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`WorldReviewsMap: Container #${this.containerId} not found`);
      return;
    }
    container.innerHTML = `
      <div class="wrm-container">
        <div class="wrm-map-wrapper">
          <div class="wrm-loading">
            <div class="wrm-spinner"></div>
            <p class="wrm-loading-text">Loading map...</p>
          </div>
        </div>
      </div>
    `;
  }

  hideLoading() {
    const loading = document.querySelector(`#${this.containerId} .wrm-loading`);
    if (loading) {
      loading.style.opacity = '0';
      setTimeout(() => loading.remove(), 300);
    }
  }

  async loadReviews() {
    try {
      const response = await fetch(this.reviewsPath);
      const csvText = await response.text();
      this.reviewsData = this.parseCSV(csvText);
      console.log(`Loaded ${this.reviewsData.length} reviews`);
    } catch (error) {
      console.error('WorldReviewsMap: Error loading reviews:', error);
      this.reviewsData = [];
    }
  }

  parseCSV(csvText) {
    const lines = csvText.split('\n');
    if (lines.length === 0) return [];
    
    const headers = this.parseCSVLine(lines[0]);
    const reviews = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = this.parseCSVLine(lines[i]);
        const review = {};
        headers.forEach((header, index) => {
          review[header.trim()] = values[index] ? values[index].trim() : '';
        });
        if (review.reviewer_country_code) {
          reviews.push(review);
        }
      }
    }
    return reviews;
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  getCountryNameFromCode(code) {
    const codeToName = {
      'US': 'United States of America', 'GB': 'United Kingdom', 'DE': 'Germany',
      'FR': 'France', 'AU': 'Australia', 'CA': 'Canada', 'NL': 'Netherlands',
      'CH': 'Switzerland', 'AT': 'Austria', 'AE': 'United Arab Emirates',
      'UZ': 'Uzbekistan', 'FI': 'Finland', 'IN': 'India', 'JP': 'Japan',
      'BR': 'Brazil', 'SE': 'Sweden', 'NO': 'Norway', 'SG': 'Singapore',
      'ZA': 'South Africa', 'MX': 'Mexico', 'ES': 'Spain', 'IT': 'Italy',
      'NZ': 'New Zealand', 'IE': 'Ireland', 'BE': 'Belgium', 'DK': 'Denmark',
      'PL': 'Poland', 'PT': 'Portugal', 'CZ': 'Czech Republic', 'IL': 'Israel',
      'KR': 'South Korea', 'CN': 'China', 'MY': 'Malaysia', 'ID': 'Indonesia',
      'PH': 'Philippines', 'TH': 'Thailand', 'VN': 'Vietnam', 'SA': 'Saudi Arabia',
      'QA': 'Qatar', 'KW': 'Kuwait', 'AR': 'Argentina', 'CL': 'Chile',
      'CO': 'Colombia', 'EG': 'Egypt', 'NG': 'Nigeria', 'KE': 'Kenya',
      'MA': 'Morocco', 'TR': 'Turkey', 'GR': 'Greece', 'RU': 'Russia',
      'UA': 'Ukraine', 'RO': 'Romania', 'HU': 'Hungary', 'PK': 'Pakistan',
      'BD': 'Bangladesh', 'SK': 'Slovakia', 'HR': 'Croatia', 'BG': 'Bulgaria',
      'RS': 'Serbia', 'SI': 'Slovenia', 'LT': 'Lithuania', 'LV': 'Latvia',
      'EE': 'Estonia', 'IS': 'Iceland', 'LU': 'Luxembourg', 'MT': 'Malta',
      'CY': 'Cyprus'
    };
    return codeToName[code] || code;
  }

  getReviewsByCountry(countryName) {
    return this.reviewsData.filter(review => {
      const reviewCountry = this.getCountryNameFromCode(review.reviewer_country_code);
      return reviewCountry === countryName || review.reviewer_country === countryName;
    });
  }

  setupDimensions() {
    const container = document.getElementById(this.containerId);
    const wrapper = container.querySelector('.wrm-map-wrapper');
    this.width = wrapper ? wrapper.clientWidth - 40 : 800;
    this.height = Math.min(this.width * 0.5, 500);
  }

  createSVG() {
    const container = document.getElementById(this.containerId);
    const wrapper = container.querySelector('.wrm-map-wrapper');
    
    wrapper.innerHTML = '';
    
    this.svg = d3.select(wrapper)
      .append('svg')
      .attr('class', 'wrm-map-svg')
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const defs = this.svg.append('defs');
    const gradient = defs.append('radialGradient')
      .attr('id', 'wrm-ocean')
      .attr('cx', '50%').attr('cy', '50%').attr('r', '70%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#1e293b');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#0f172a');

    this.svg.append('rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('fill', 'url(#wrm-ocean)');

    this.g = this.svg.append('g');

    this.projection = d3.geoNaturalEarth1()
      .scale(this.width / 5.5)
      .translate([this.width / 2, this.height / 2]);

    this.path = d3.geoPath().projection(this.projection);

    this.zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on('zoom', (event) => this.g.attr('transform', event.transform));

    this.svg.call(this.zoom);
  }

  createTooltip() {
    d3.select('.wrm-tooltip').remove();
    
    this.tooltip = d3.select('body')
      .append('div')
      .attr('class', 'wrm-tooltip');
  }

  createZoomControls() {
    const wrapper = document.querySelector(`#${this.containerId} .wrm-map-wrapper`);
    
    const controls = document.createElement('div');
    controls.className = 'wrm-zoom-controls';
    controls.innerHTML = `
      <button class="wrm-zoom-btn" data-action="in" title="Zoom In">+</button>
      <button class="wrm-zoom-btn" data-action="out" title="Zoom Out">−</button>
      <button class="wrm-zoom-btn" data-action="reset" title="Reset">↺</button>
    `;
    wrapper.appendChild(controls);

    controls.addEventListener('click', (e) => {
      const btn = e.target.closest('.wrm-zoom-btn');
      if (!btn) return;
      
      const action = btn.dataset.action;
      if (action === 'in') {
        this.svg.transition().duration(300).call(this.zoom.scaleBy, 1.5);
      } else if (action === 'out') {
        this.svg.transition().duration(300).call(this.zoom.scaleBy, 0.67);
      } else if (action === 'reset') {
        this.svg.transition().duration(400).call(this.zoom.transform, d3.zoomIdentity);
      }
    });
  }

  async drawMap() {
    const worldData = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
    const countries = topojson.feature(worldData, worldData.objects.countries);

    const countryNames = {
      "004": "Afghanistan", "008": "Albania", "012": "Algeria", "024": "Angola",
      "032": "Argentina", "036": "Australia", "040": "Austria", "031": "Azerbaijan",
      "050": "Bangladesh", "056": "Belgium", "204": "Benin", "064": "Bhutan",
      "068": "Bolivia", "070": "Bosnia and Herzegovina", "072": "Botswana", "076": "Brazil",
      "096": "Brunei", "100": "Bulgaria", "854": "Burkina Faso", "108": "Burundi",
      "116": "Cambodia", "120": "Cameroon", "124": "Canada", "140": "Central African Republic",
      "148": "Chad", "152": "Chile", "156": "China", "170": "Colombia",
      "178": "Congo", "180": "Democratic Republic of the Congo", "188": "Costa Rica",
      "384": "Ivory Coast", "191": "Croatia", "192": "Cuba", "196": "Cyprus",
      "203": "Czech Republic", "208": "Denmark", "262": "Djibouti", "214": "Dominican Republic",
      "218": "Ecuador", "818": "Egypt", "222": "El Salvador", "226": "Equatorial Guinea",
      "232": "Eritrea", "233": "Estonia", "231": "Ethiopia", "246": "Finland",
      "250": "France", "266": "Gabon", "270": "Gambia", "268": "Georgia",
      "276": "Germany", "288": "Ghana", "300": "Greece", "320": "Guatemala",
      "324": "Guinea", "328": "Guyana", "332": "Haiti", "340": "Honduras",
      "348": "Hungary", "352": "Iceland", "356": "India", "360": "Indonesia",
      "364": "Iran", "368": "Iraq", "372": "Ireland", "376": "Israel",
      "380": "Italy", "388": "Jamaica", "392": "Japan", "400": "Jordan",
      "398": "Kazakhstan", "404": "Kenya", "408": "North Korea", "410": "South Korea",
      "414": "Kuwait", "417": "Kyrgyzstan", "418": "Laos", "428": "Latvia",
      "422": "Lebanon", "426": "Lesotho", "430": "Liberia", "434": "Libya",
      "440": "Lithuania", "442": "Luxembourg", "450": "Madagascar", "454": "Malawi",
      "458": "Malaysia", "466": "Mali", "478": "Mauritania", "484": "Mexico",
      "496": "Mongolia", "499": "Montenegro", "504": "Morocco", "508": "Mozambique",
      "104": "Myanmar", "516": "Namibia", "524": "Nepal", "528": "Netherlands",
      "554": "New Zealand", "558": "Nicaragua", "562": "Niger", "566": "Nigeria",
      "578": "Norway", "512": "Oman", "586": "Pakistan", "591": "Panama",
      "598": "Papua New Guinea", "600": "Paraguay", "604": "Peru", "608": "Philippines",
      "616": "Poland", "620": "Portugal", "634": "Qatar", "642": "Romania",
      "643": "Russia", "646": "Rwanda", "682": "Saudi Arabia", "686": "Senegal",
      "688": "Serbia", "694": "Sierra Leone", "702": "Singapore", "703": "Slovakia",
      "705": "Slovenia", "706": "Somalia", "710": "South Africa", "728": "South Sudan",
      "724": "Spain", "144": "Sri Lanka", "729": "Sudan", "740": "Suriname",
      "748": "Swaziland", "752": "Sweden", "756": "Switzerland", "760": "Syria",
      "762": "Tajikistan", "834": "Tanzania", "764": "Thailand", "768": "Togo",
      "780": "Trinidad and Tobago", "788": "Tunisia", "792": "Turkey", "795": "Turkmenistan",
      "800": "Uganda", "804": "Ukraine", "784": "United Arab Emirates",
      "826": "United Kingdom", "840": "United States of America", "858": "Uruguay",
      "860": "Uzbekistan", "862": "Venezuela", "704": "Vietnam", "887": "Yemen",
      "894": "Zambia", "716": "Zimbabwe", "112": "Belarus", "807": "North Macedonia",
      "051": "Armenia"
    };
    const nameById = new Map(Object.entries(countryNames));

    const countryPaths = this.g.selectAll('path')
      .data(countries.features)
      .enter()
      .append('path');
    
    countryPaths
      .attr('class', d => {
        const name = nameById.get(d.id) || '';
        const reviews = this.getReviewsByCountry(name);
        return reviews.length > 0 ? 'wrm-country wrm-has-reviews' : 'wrm-country';
      })
      .attr('d', this.path)
      .attr('data-name', d => nameById.get(d.id) || 'Unknown');
    
    countryPaths.filter(d => {
        const name = nameById.get(d.id) || '';
        return this.getReviewsByCountry(name).length > 0;
      })
      .on('mouseover', (event, d) => this.handleMouseOver(event, d, nameById))
      .on('mousemove', (event) => this.handleMouseMove(event))
      .on('mouseout', () => this.handleMouseOut())
      .on('touchstart', (event, d) => {
        this.handleMouseOut();
        this.handleMouseOver(event, d, nameById);
      }, { passive: true });
    
    document.addEventListener('touchstart', (e) => {
      if (!e.target.closest('.wrm-country') && !e.target.closest('.wrm-tooltip')) {
        this.handleMouseOut();
      }
    }, { passive: true });
  }

  handleMouseOver(event, d, nameById) {
    const name = nameById.get(d.id) || 'Unknown';
    const reviews = this.getReviewsByCountry(name);

    const reviewCards = reviews.map(r => this.createReviewCard(r)).join('');
    const duration = Math.max(8, reviews.length * 4);
    
    this.tooltip.html(`
      <div class="wrm-tooltip-header">
        <p class="wrm-tooltip-country">${name}</p>
        <p class="wrm-tooltip-stats">
          <span class="wrm-count">${reviews.length}</span>
          <span>review${reviews.length !== 1 ? 's' : ''}</span>
        </p>
      </div>
      <div class="wrm-reviews-scroll">
        <div class="wrm-reviews-track" style="animation-duration: ${duration}s;">
          ${reviewCards}${reviewCards}
        </div>
      </div>
    `);

    this.tooltip.classed('wrm-visible', true);
    
    d3.select(event.currentTarget)
      .raise()
      .transition()
      .duration(200)
      .style('filter', 'drop-shadow(0 0 12px rgba(244, 63, 94, 0.7))');
  }

  createReviewCard(review) {
    const initial = (review.username || 'U').charAt(0).toUpperCase();
    const avatarHtml = review.user_image_url 
      ? `<img src="${review.user_image_url}" alt="" onerror="this.parentElement.innerHTML='<div class=\\'wrm-avatar-placeholder\\'>${initial}</div>'">`
      : `<div class="wrm-avatar-placeholder">${initial}</div>`;
    
    const industryHtml = review.reviewer_industry 
      ? `<p class="wrm-review-industry">${review.reviewer_industry.replace(/_/g, ' ')}</p>` 
      : '';

    return `
      <div class="wrm-review">
        <div class="wrm-review-header">
          <div class="wrm-review-avatar">${avatarHtml}</div>
          <div class="wrm-review-info">
            <p class="wrm-review-name">@${review.username || 'anonymous'}</p>
            ${industryHtml}
          </div>
        </div>
        <p class="wrm-review-text">${review.comment || ''}</p>
      </div>
    `;
  }

  handleMouseMove(event) {
    if (window.innerWidth <= 768) return;

    const node = this.tooltip.node();
    const w = node.offsetWidth;
    const h = node.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    let left = event.clientX + 15;
    let top = event.clientY - 10;

    if (left + w > vw - 10) left = event.clientX - w - 15;
    if (left < 10) left = 10;
    if (top + h > vh - 10) top = event.clientY - h - 10;
    if (top < 10) top = 10;

    this.tooltip.style('left', `${left}px`).style('top', `${top}px`);
  }

  handleMouseOut() {
    this.tooltip.classed('wrm-visible', false);
    d3.selectAll('.wrm-country').transition().duration(200).style('filter', null);
  }

  updateStats() {
    const container = document.getElementById(this.containerId);
    const wrmContainer = container.querySelector('.wrm-container');
    
    const countriesSet = new Set();
    this.reviewsData.forEach(r => {
      countriesSet.add(this.getCountryNameFromCode(r.reviewer_country_code));
    });

    if (this.showLegend) {
      const legend = document.createElement('div');
      legend.className = 'wrm-legend';
      legend.innerHTML = `
        <div class="wrm-legend-item">
          <div class="wrm-legend-color wrm-inactive"></div>
          <span>No reviews</span>
        </div>
        <div class="wrm-legend-item">
          <div class="wrm-legend-color wrm-active"></div>
          <span>Has reviews</span>
        </div>
      `;
      wrmContainer.appendChild(legend);
    }

    const stats = document.createElement('div');
    stats.className = 'wrm-stats';
    stats.innerHTML = `
      <div class="wrm-stat">
        <div class="wrm-stat-value">${countriesSet.size}</div>
        <div class="wrm-stat-label">Countries</div>
      </div>
      <div class="wrm-stat">
        <div class="wrm-stat-value">${this.reviewsData.length}</div>
        <div class="wrm-stat-label">Reviews</div>
      </div>
    `;
    wrmContainer.appendChild(stats);
  }

  async refresh() {
    await this.loadReviews();
    await this.init();
  }

  destroy() {
    if (this.tooltip) this.tooltip.remove();
    const container = document.getElementById(this.containerId);
    if (container) container.innerHTML = '';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorldReviewsMap;
}
