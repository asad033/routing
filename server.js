const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const API = process.env.GOOGLE_API_KEY; 
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ==========================================
// --- CUSTOM DATABASE (Embedded) ---
// ==========================================

const DB_CHIKMAGALUR = {
  center: { lat: 13.3153, lng: 75.7754 },
  categories: [
    { "category": "Peaks & Trekking", "icon": "⛰️" },
    { "category": "Waterfalls & Natural Springs", "icon": "💧" },
    { "category": "Spiritual & Architectural Heritage", "icon": "🛕" },
    { "category": "Coffee & Culinary Tourism", "icon": "☕" },
    { "category": "Wildlife & Conservation", "icon": "🐅" },
    { "category": "Lakes, Dams & Forts", "icon": "🏰" }
  ],
  places: [
    { "city": "Chikmagalur", "place_name": "Mullayanagiri Peak", "category": "Peaks & Trekking", "description": "Highest peak in Karnataka.", "image": "/images/chikmagalur/Mullayanagiri.jpg", "rating": 4.8, "lat": 13.3932, "lng": 75.7196 },
    { "city": "Chikmagalur", "place_name": "Baba Budangiri", "category": "Peaks & Trekking", "description": "Sacred mountain range.", "image": "/images/chikmagalur/Baba_Budangiri.jpg", "rating": 4.5, "lat": 13.4357, "lng": 75.7670 },
    { "city": "Kemmanagundi", "place_name": "Z Point", "category": "Peaks & Trekking", "description": "Vantage point.", "image": "/images/chikmagalur/Z_Point.jpg", "rating": 4.6, "lat": 13.5410, "lng": 75.7001 },
    { "city": "Kudremukh", "place_name": "Kudremukh Peak Trek", "category": "Peaks & Trekking", "description": "Horse-face shaped peak.", "image": "/images/chikmagalur/Kudremukh_Peak.jpg", "rating": 4.7, "lat": 13.2190, "lng": 75.2500 },
    { "city": "Kemmanagundi", "place_name": "Hebbe Falls", "category": "Waterfalls & Natural Springs", "description": "Two-tiered waterfall.", "image": "/images/chikmagalur/Hebbe_Falls.jpg", "rating": 4.6, "lat": 13.5476, "lng": 75.7191 },
    { "city": "Attigundi", "place_name": "Jhari Falls", "category": "Waterfalls & Natural Springs", "description": "Buttermilk Falls.", "image": "/images/chikmagalur/Jhari_Falls.jpg", "rating": 4.5, "lat": 13.4150, "lng": 75.7400 },
    { "city": "Kemmanagundi", "place_name": "Kalhatti Falls", "category": "Waterfalls & Natural Springs", "description": "Temple waterfall.", "image": "/images/chikmagalur/Kalhatti_Falls.jpg", "rating": 4.3, "lat": 13.5447, "lng": 75.6983 },
    { "city": "Sringeri", "place_name": "Sringeri Sharada Peetham", "category": "Spiritual & Architectural Heritage", "description": "Historical temple complex.", "image": "/images/chikmagalur/Sringeri_Sharada_Peetham.jpg", "rating": 4.9, "lat": 13.4150, "lng": 75.2550 },
    { "city": "Horanadu", "place_name": "Annapoorneshwari Temple", "category": "Spiritual & Architectural Heritage", "description": "Goddess of Food.", "image": "/images/chikmagalur/Horanadu_Temple.jpg", "rating": 4.8, "lat": 13.2618, "lng": 75.1481 },
    { "city": "Belur", "place_name": "Chennakesava Temple", "category": "Spiritual & Architectural Heritage", "description": "Hoysala architecture.", "image": "/images/chikmagalur/Belur_Temple.jpg", "rating": 4.8, "lat": 13.1650, "lng": 75.8590 },
    { "city": "Chikmagalur Town", "place_name": "Coffee Museum", "category": "Coffee & Culinary Tourism", "description": "History of coffee.", "image": "/images/chikmagalur/Coffee_Museum.jpg", "rating": 4.4, "lat": 13.3280, "lng": 75.7830 },
    { "city": "Various", "place_name": "Coffee Plantation Tours", "category": "Coffee & Culinary Tourism", "description": "Bean-to-cup processes.", "image": "/images/chikmagalur/Coffee_Plantation.jpg", "rating": 4.7, "lat": 13.3500, "lng": 75.7500 },
    { "city": "Muthodi", "place_name": "Bhadra Wildlife Sanctuary", "category": "Wildlife & Conservation", "description": "Tiger Reserve.", "image": "/images/chikmagalur/Bhadra_Wildlife_Sanctuary.jpg", "rating": 4.4, "lat": 13.7225, "lng": 75.5268 },
    { "city": "Kudremukh", "place_name": "Kudremukh National Park", "category": "Wildlife & Conservation", "description": "Biodiversity hotspot.", "image": "/images/chikmagalur/Kudremukh_National_Park.jpg", "rating": 4.7, "lat": 13.2000, "lng": 75.2500 },
    { "city": "Chikmagalur", "place_name": "Hirekolale Lake", "category": "Lakes, Dams & Forts", "description": "Sunset views.", "image": "/images/chikmagalur/Hirekolale_Lake.jpg", "rating": 4.5, "lat": 13.3150, "lng": 75.7350 },
    { "city": "Kadur", "place_name": "Ayyanakere Lake", "category": "Lakes, Dams & Forts", "description": "Second largest lake in Karnataka.", "image": "/images/chikmagalur/Ayyanakere_Lake.jpg", "rating": 4.3, "lat": 13.4500, "lng": 75.9000 },
    { "city": "Kudremukh", "place_name": "Ballalarayana Durga Fort", "category": "Lakes, Dams & Forts", "description": "Fort ruins trek.", "image": "/images/chikmagalur/Ballalarayana_Durga_Fort.jpg", "rating": 4.4, "lat": 13.1890, "lng": 75.2280 }
  ]
};

const DB_ANDAMAN = {
  center: { lat: 11.6234, lng: 92.7265 },
  categories: [
    { "category": "Scuba & Snorkeling", "icon": "🤿" },
    { "category": "Trekking & Caves", "icon": "🧗" },
    { "category": "Water Sports", "icon": "🚤" },
    { "category": "Pristine Beaches", "icon": "🏖️" },
    { "category": "Luxury & Wellness", "icon": "💆‍♀️" },
    { "category": "Family Friendly", "icon": "👨‍👩‍👧‍👦" },
    { "category": "History & Heritage", "icon": "🏛️" },
    { "category": "Eco-Tours & Nature", "icon": "🌿" },
    { "category": "Hidden Gems", "icon": "💎" },
    { "category": "Island Cuisine", "icon": "🦞" },
    { "category": "Cruises & Island Hopping", "icon": "🛳️" }
  ],
  places: [
    { "city": "Havelock", "place_name": "The Wall", "category": "Scuba & Snorkeling", "description": "Submerged rock formation.", "image": "/images/andaman/wall.jpg", "rating": 4.8, "lat": 12.0330, "lng": 92.9800 },
    { "city": "Neil Island", "place_name": "Bus Stop Reef", "category": "Scuba & Snorkeling", "description": "Shallow dive sites.", "image": "/images/andaman/neil.jpg", "rating": 4.5, "lat": 11.8400, "lng": 93.0400 },
    { "city": "Baratang", "place_name": "Limestone Caves", "category": "Trekking & Caves", "description": "Active stalactite formations.", "image": "/images/andaman/caves.jpg", "rating": 4.5, "lat": 12.1050, "lng": 92.7500 },
    { "city": "Port Blair", "place_name": "Mount Harriet", "category": "Trekking & Caves", "description": "Wilderness trek.", "image": "/images/andaman/harriet.jpg", "rating": 4.2, "lat": 11.7130, "lng": 92.7350 },
    { "city": "Port Blair", "place_name": "Rajiv Gandhi Complex", "category": "Water Sports", "description": "Jet Skiing hub.", "image": "/images/andaman/sports.jpg", "rating": 4.0, "lat": 11.6680, "lng": 92.7400 },
    { "city": "Havelock", "place_name": "Elephant Beach", "category": "Water Sports", "description": "Sea walking and parasailing.", "image": "/images/andaman/elephant.jpg", "rating": 4.4, "lat": 11.9900, "lng": 92.9400 },
    { "city": "Havelock", "place_name": "Radhanagar Beach", "category": "Pristine Beaches", "description": "Asia's best beach.", "image": "/images/andaman/radhanagar.jpg", "rating": 5.0, "lat": 11.9840, "lng": 92.9510 },
    { "city": "Neil Island", "place_name": "Bharatpur Beach", "category": "Pristine Beaches", "description": "Crystal clear lagoon.", "image": "/images/andaman/bharatpur.jpg", "rating": 4.6, "lat": 11.8380, "lng": 93.0520 },
    { "city": "Havelock", "place_name": "Taj Exotica", "category": "Luxury & Wellness", "description": "Ultra-luxury villas.", "image": "/images/andaman/taj.jpg", "rating": 4.9, "lat": 12.0000, "lng": 92.9500 },
    { "city": "Port Blair", "place_name": "Samudrika Museum", "category": "Family Friendly", "description": "Naval marine museum.", "image": "/images/andaman/samudrika.jpg", "rating": 4.3, "lat": 11.6620, "lng": 92.7280 },
    { "city": "Port Blair", "place_name": "Science Centre", "category": "Family Friendly", "description": "Interactive science exhibits.", "image": "/images/andaman/science.jpg", "rating": 4.0, "lat": 11.6500, "lng": 92.7300 },
    { "city": "Port Blair", "place_name": "Cellular Jail", "category": "History & Heritage", "description": "National pilgrimage site.", "image": "/images/andaman/jail.jpg", "rating": 4.9, "lat": 11.6740, "lng": 92.7460 },
    { "city": "Ross Island", "place_name": "British Ruins", "category": "History & Heritage", "description": "Entwined with Banyan roots.", "image": "/images/andaman/ross.jpg", "rating": 4.7, "lat": 11.6770, "lng": 92.7620 },
    { "city": "Port Blair", "place_name": "Chatham Saw Mill", "category": "History & Heritage", "description": "Asia's oldest sawmill.", "image": "/images/andaman/chatham.jpg", "rating": 4.1, "lat": 11.6880, "lng": 92.7230 },
    { "city": "Port Blair", "place_name": "Chidiya Tapu", "category": "Eco-Tours & Nature", "description": "Bird Island sunset.", "image": "/images/andaman/chidiya.jpg", "rating": 4.6, "lat": 11.5080, "lng": 92.7060 },
    { "city": "Neil Island", "place_name": "Natural Bridge", "category": "Eco-Tours & Nature", "description": "Geological arch.", "image": "/images/andaman/bridge.jpg", "rating": 4.6, "lat": 11.8330, "lng": 93.0430 },
    { "city": "North Andaman", "place_name": "Ross and Smith Islands", "category": "Hidden Gems", "description": "Twin islands sandbar.", "image": "/images/andaman/rosssmith.jpg", "rating": 4.8, "lat": 13.3080, "lng": 92.9700 },
    { "city": "Great Nicobar", "place_name": "Indira Point", "category": "Hidden Gems", "description": "Southernmost tip of India.", "image": "/images/andaman/indira.jpg", "rating": 4.7, "lat": 6.7530, "lng": 93.8260 },
    { "city": "Long Island", "place_name": "Lalaji Bay", "category": "Hidden Gems", "description": "Raw tourism destination.", "image": "/images/andaman/lalaji.jpg", "rating": 4.3, "lat": 12.4000, "lng": 92.9300 },
    { "city": "Havelock", "place_name": "Nemo Café", "category": "Island Cuisine", "description": "Beachside nightlife.", "image": "/images/andaman/nemo.jpg", "rating": 4.2, "lat": 12.0100, "lng": 92.9600 },
    { "city": "Port Blair", "place_name": "Amaya Lounge", "category": "Island Cuisine", "description": "Rooftop harbor views.", "image": "/images/andaman/amaya.jpg", "rating": 4.4, "lat": 11.6650, "lng": 92.7300 },
    { "city": "Port Blair", "place_name": "Bella Bay Cruise", "category": "Cruises & Island Hopping", "description": "Luxury dinner cruise.", "image": "/images/andaman/bella.jpg", "rating": 4.3, "lat": 11.6600, "lng": 92.7400 },
    { "city": "Inter-Island", "place_name": "Makruzz", "category": "Cruises & Island Hopping", "description": "High-speed catamaran.", "image": "/images/andaman/makruzz.jpg", "rating": 4.5, "lat": 11.6700, "lng": 92.7400 }
  ]
};

const DB_MANALI = {
  center: { lat: 32.2396, lng: 77.1887 },
  categories: [
    { "category": "Cultural Heritage & History", "icon": "🏛️" },
    { "category": "Spiritual & Wellness", "icon": "🧘" },
    { "category": "High-Adrenaline & Adventure", "icon": "🧗" },
    { "category": "Scenic Vistas & High-Altitude", "icon": "🏞️" },
    { "category": "Ecotourism & Wilderness Trekking", "icon": "🌿" },
    { "category": "Art, Offbeat & Local Immersion", "icon": "🎨" },
    { "category": "Local Cuisine & Cafés", "icon": "🍽️" },
    { "category": "Retail & Souvenirs", "icon": "🛍️" }
  ],
  places: [
    { "city": "Manali Town", "place_name": "Hidimba Devi Temple", "category": "Cultural Heritage & History", "description": "16th-century pagoda temple.", "image": "/images/manali/hidimba.jpg", "rating": 4.8, "lat": 32.2530, "lng": 77.1850 },
    { "city": "Naggar", "place_name": "Naggar Castle", "category": "Cultural Heritage & History", "description": "Heritage hotel castle.", "image": "/images/manali/naggar.jpg", "rating": 4.7, "lat": 32.1460, "lng": 77.1650 },
    { "city": "Vashisht", "place_name": "Vashisht Hot Springs", "category": "Spiritual & Wellness", "description": "Sulphurous springs.", "image": "/images/manali/vashisht.jpg", "rating": 4.4, "lat": 32.2650, "lng": 77.1850 },
    { "city": "Manali Town", "place_name": "Manu Temple", "category": "Spiritual & Wellness", "description": "Temple of Sage Manu.", "image": "/images/manali/manu.jpg", "rating": 4.5, "lat": 32.2580, "lng": 77.1700 },
    { "city": "Solang", "place_name": "Solang Valley Adventure", "category": "High-Adrenaline & Adventure", "description": "Paragliding and skiing.", "image": "/images/manali/solang.jpg", "rating": 4.6, "lat": 32.3160, "lng": 77.1550 },
    { "city": "Babeli", "place_name": "River Rafting", "category": "High-Adrenaline & Adventure", "description": "Beas river rafting.", "image": "/images/manali/rafting.jpg", "rating": 4.3, "lat": 32.0620, "lng": 77.2000 },
    { "city": "Manali", "place_name": "Jogini Waterfall Trek", "category": "High-Adrenaline & Adventure", "description": "Scenic waterfall trail.", "image": "/images/manali/jogini.jpg", "rating": 4.5, "lat": 32.2600, "lng": 77.1800 },
    { "city": "High-Altitude", "place_name": "Rohtang Pass", "category": "Scenic Vistas & High-Altitude", "description": "Snow point and views.", "image": "/images/manali/rohtang.jpg", "rating": 4.9, "lat": 32.3780, "lng": 77.2500 },
    { "city": "Solang", "place_name": "Atal Tunnel", "category": "Scenic Vistas & High-Altitude", "description": "Engineering marvel.", "image": "/images/manali/atal.jpg", "rating": 4.7, "lat": 32.3080, "lng": 77.1700 },
    { "city": "Kullu", "place_name": "Great Himalayan National Park", "category": "Ecotourism & Wilderness Trekking", "description": "UNESCO heritage site.", "image": "/images/manali/ghnp.jpg", "rating": 4.9, "lat": 31.8100, "lng": 77.4200 },
    { "city": "Naggar", "place_name": "Nicholas Roerich Gallery", "category": "Art, Offbeat & Local Immersion", "description": "Russian artist estate.", "image": "/images/manali/roerich.jpg", "rating": 4.5, "lat": 32.1480, "lng": 77.1680 },
    { "city": "Sethan", "place_name": "Igloo Stay", "category": "Art, Offbeat & Local Immersion", "description": "Winter igloo stay.", "image": "/images/manali/igloo.jpg", "rating": 4.6, "lat": 32.2700, "lng": 77.1800 },
    { "city": "Offbeat", "place_name": "Rumsu Village", "category": "Art, Offbeat & Local Immersion", "description": "Authentic Himachali culture.", "image": "/images/manali/rumsu.jpg", "rating": 4.3, "lat": 32.1600, "lng": 77.1900 },
    { "city": "Old Manali", "place_name": "Café 1947", "category": "Local Cuisine & Cafés", "description": "Vibrant riverside cafe.", "image": "/images/manali/cafe1947.jpg", "rating": 4.2, "lat": 32.2580, "lng": 77.1750 },
    { "city": "Manali", "place_name": "Mall Road", "category": "Retail & Souvenirs", "description": "Shopping heart.", "image": "/images/manali/mall.jpg", "rating": 4.1, "lat": 32.2430, "lng": 77.1880 }
  ]
};

// ==========================================
// --- CONFIGURATION & UTILS ---
// ==========================================

const GOOGLE_CATEGORIES = [
  { label: "Top Sights ⭐", type: "tourist_attraction" },
  { label: "Museums 🏛️", type: "museum" },
  { label: "Parks & Nature 🌳", type: "park" },
  { label: "Temples/Worship ⛪", type: "place_of_worship" },
  { label: "Shopping 🛍️", type: "shopping_mall" },
  { label: "Food & Dining 🍽️", type: "restaurant" },
  { label: "Adventure 🎢", type: "amusement_park" },
  { label: "Nightlife 🎵", type: "night_club" }
];

const EXCLUDED_TYPES = [
  'travel_agency', 'real_estate_agency', 'insurance_agency', 'moving_company',
  'lawyer', 'accounting', 'dentist', 'doctor', 'hospital', 'physiotherapist', 
  'veterinary_care', 'pharmacy', 'plumber', 'electrician', 'locksmith', 
  'painter', 'roofing_contractor', 'car_repair', 'car_wash', 'laundry',
  'funeral_home', 'storage', 'atm', 'bank', 'city_hall', 'courthouse', 
  'embassy', 'fire_station', 'local_government_office', 'police', 
  'post_office', 'school', 'university', 'taxi_stand', 'gas_station', 
  'parking', 'car_rental', 'lodging' 
];

const CATEGORY_TYPE_MAPPINGS = {
  "tourist_attraction": ["tourist_attraction", "point_of_interest", "establishment"],
  "museum": ["museum", "art_gallery"],
  "park": ["park", "natural_feature", "campground"],
  "place_of_worship": ["place_of_worship", "church", "hindu_temple", "mosque", "synagogue"],
  "shopping_mall": ["shopping_mall", "department_store", "market", "clothing_store"],
  "restaurant": ["restaurant", "cafe", "food", "bakery"],
  "amusement_park": ["amusement_park", "zoo", "aquarium"],
  "night_club": ["night_club", "bar", "casino"]
};

// Haversine Distance
function hav(lat1, lon1, lat2, lon2){
  const R = 6371; 
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Check which custom DB is active
function getCustomDB(lat, lng) {
  if (!lat || !lng) return null;
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  
  const dManali = hav(latNum, lngNum, DB_MANALI.center.lat, DB_MANALI.center.lng);
  if (dManali < 30) return DB_MANALI;

  const dChik = hav(latNum, lngNum, DB_CHIKMAGALUR.center.lat, DB_CHIKMAGALUR.center.lng);
  if (dChik < 30) return DB_CHIKMAGALUR;

  const dAndaman = hav(latNum, lngNum, DB_ANDAMAN.center.lat, DB_ANDAMAN.center.lng);
  if (dAndaman < 100) return DB_ANDAMAN; 

  return null;
}

// ==========================================
// --- ROUTES ---
// ==========================================

// 1. GEOCODE 
app.get('/api/geocode', async (req,res) => {
  try {
    const q = req.query.q;
    if(!q) return res.json({results:[]});
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&key=${API}`;
    const r = await axios.get(url);
    const results = (r.data.results || []).slice(0, 5).map(p => ({
      name: p.name,
      lat: p.geometry.location.lat,
      lng: p.geometry.location.lng,
      formatted_address: p.formatted_address,
      place_id: p.place_id
    }));
    res.json({ results });
  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

// 2. CATEGORIES
app.get('/api/categories', async (req, res) => {
  const { lat, lng } = req.query;
  const customDB = getCustomDB(lat, lng);

  if (customDB) {
    const cats = customDB.categories.map(c => ({
      label: `${c.category} ${c.icon || ''}`,
      type: c.category
    }));
    return res.json({ categories: cats });
  }

  res.json({ categories: GOOGLE_CATEGORIES });
});

// 3. PLACES (Hybrid: Custom JSON or Google)
app.get('/api/places', async (req,res) => {
  try {
    const {lat, lng, type} = req.query;
    if(!lat || !lng) return res.status(400).json({error:'lat,lng required'});
    
    // CHECK CUSTOM DB FIRST
    const customDB = getCustomDB(lat, lng);
    
    if (customDB) {
      const filtered = customDB.places.filter(p => p.category === type);
      
      const results = filtered.map((p, index) => ({
        place_id: `custom_${index}_${Date.now()}`,
        name: p.place_name,
        lat: p.lat,
        lng: p.lng,
        rating: p.rating,
        user_ratings_total: 100, 
        address: p.city,
        types: [p.category], 
        photo_ref: `LOCAL:${p.image}`, 
        distance_km: hav(parseFloat(lat), parseFloat(lng), p.lat, p.lng),
        description: p.description
      })).sort((a,b) => b.rating - a.rating);

      return res.json({ results });
    }

    // --- GOOGLE API FALLBACK ---
    const requestedCategory = type || 'tourist_attraction';
    const radius = 15000;
    
    const searchKeywords = {
      "place_of_worship": "temple church mosque",
      "museum": "museum gallery",
      "park": "park garden",
      "shopping_mall": "shopping mall market",
      "restaurant": "restaurant cafe food",
      "amusement_park": "amusement park zoo aquarium",
      "night_club": "nightclub bar club",
      "tourist_attraction": "tourist attraction sightseeing"
    };
    
    const keyword = searchKeywords[requestedCategory] || requestedCategory;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(keyword)}&location=${lat},${lng}&radius=${radius}&key=${API}`;
    const r = await axios.get(url);
    
    const originLat = parseFloat(lat);
    const originLng = parseFloat(lng);
    
    let places = (r.data.results || [])
      .map(p => {
        const distance = hav(originLat, originLng, p.geometry.location.lat, p.geometry.location.lng);
        return {
          place_id: p.place_id,
          name: p.name,
          lat: p.geometry.location.lat,
          lng: p.geometry.location.lng,
          rating: p.rating,
          user_ratings_total: p.user_ratings_total,
          address: p.formatted_address || p.vicinity,
          types: p.types || [],
          photo_ref: p.photos && p.photos[0] ? p.photos[0].photo_reference : null,
          distance_km: distance
        };
      })
      .filter(p => {
        if(p.distance_km > 20) return false;
        if (p.rating && p.rating < 3.0) return false;
        const isJunk = p.types.some(t => EXCLUDED_TYPES.includes(t));
        if(isJunk) return false;
        const allowedTypes = CATEGORY_TYPE_MAPPINGS[requestedCategory] || [requestedCategory];
        const hasRelevantType = p.types.some(type => allowedTypes.includes(type));
        const isPointOfInterest = p.types.includes('point_of_interest') || p.types.includes('tourist_attraction');
        if(!hasRelevantType && !isPointOfInterest) return false;
        return true;
      })
      .sort((a,b) => {
        const scoreA = (a.rating || 0) * Math.log(a.user_ratings_total || 1) / (1 + a.distance_km/10);
        const scoreB = (b.rating || 0) * Math.log(b.user_ratings_total || 1) / (1 + b.distance_km/10);
        return scoreB - scoreA;
      })
      .slice(0, 30);
    
    res.json({ results: places });

  } catch(e) {
    console.error('Places API error:', e.message);
    res.status(500).json({error: e.message});
  }
});

// 4. HOTELS
app.get('/api/hotels', async (req,res) => {
  try {
    const {lat, lng} = req.query;
    if(!lat || !lng) return res.status(400).json({error:'lat,lng required'});
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=10000&type=lodging&key=${API}`;
    const r = await axios.get(url);
    const hotels = (r.data.results || [])
      .filter(h => (h.rating || 0) >= 3.5)
      .map(p => ({
        place_id: p.place_id,
        name: p.name,
        lat: p.geometry.location.lat,
        lng: p.geometry.location.lng,
        rating: p.rating,
        user_ratings_total: p.user_ratings_total,
        address: p.vicinity,
        types: p.types,
        photo_ref: p.photos && p.photos[0] ? p.photos[0].photo_reference : null,
      }))
      .sort((a,b) => (b.rating || 0) - (a.rating || 0));
    res.json({ results: hotels });
  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

// 5. PHOTOS (Enhanced with Smart Fallback)
app.get('/api/photo', async (req, res) => {
  const { ref, keyword } = req.query;
  const fallbackImage = 'https://placehold.co/400x300?text=No+Image+Available';
  
  // 1. Local Image (from your Custom DB)
  if (ref && ref.startsWith('LOCAL:')) {
    const localPath = ref.replace('LOCAL:', '');
    // In a real app, you'd serve the file. Here we fallback.
    return res.redirect(fallbackImage); 
  }

  // 2. Google Photo Reference
  if (ref && ref !== 'null' && ref !== 'undefined') {
    return res.redirect(`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${encodeURIComponent(ref)}&key=${API}`);
  }

  // 3. Web Search Fallback (Bing Images)
  if (keyword) {
    const cleanKeyword = `${keyword} travel landmark`;
    // Using Bing Thumbnail API for direct image
    const searchUrl = `https://tse1.mm.bing.net/th?q=${encodeURIComponent(cleanKeyword)}&w=400&h=300&c=7&rs=1&p=0`;
    return res.redirect(searchUrl);
  }
  
  // 4. Final Fallback
  res.redirect(fallbackImage);
});

// 6. RESOLVE PLACE (Verification Logic)
app.get('/api/resolve-place', async (req, res) => {
  try {
    const { name, location } = req.query; 
    if (!name) return res.status(400).json({ error: 'Name required' });

    const query = `${name} ${location || ''}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API}`;
    
    const r = await axios.get(url);
    const results = r.data.results || [];

    if (results.length > 0) {
      const bestMatch = results[0]; 
      
      res.json({
        found: true,
        place_id: bestMatch.place_id,
        lat: bestMatch.geometry.location.lat,
        lng: bestMatch.geometry.location.lng,
        address: bestMatch.formatted_address,
        rating: bestMatch.rating,
        user_ratings_total: bestMatch.user_ratings_total,
        types: bestMatch.types,
        photo_ref: bestMatch.photos && bestMatch.photos[0] ? bestMatch.photos[0].photo_reference : null
      });
    } else {
      res.json({ found: false });
    }
  } catch (e) {
    console.error("Resolve Error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// 7. GENERATE ITINERARY
const MAX_HUMAN_LIMIT_PER_DAY = 6;
const IDEAL_PACE_PER_DAY = 3;

app.post('/api/plan', async (req, res) => {
  try {
    const payload = req.body || {};
    const selectedPlaces = payload.selectedPlaces || payload.attractions || [];
    const startDate = payload.startDate || null;
    const endDate = payload.endDate || null;
    const explicitDays = Number(payload.days || 0) || 0;

    if(!Array.isArray(selectedPlaces) || selectedPlaces.length === 0) {
      return res.status(400).json({ error: 'selectedPlaces required' });
    }

    let days = 1;
    if(startDate && endDate){
      const sd = new Date(startDate);
      const ed = new Date(endDate);
      days = Math.floor((ed - sd)/(24*3600*1000)) + 1;
    } else if(explicitDays > 0){
      days = explicitDays;
    }

    if (selectedPlaces.length > days * MAX_HUMAN_LIMIT_PER_DAY) {
      return res.json({
        status: 'failed',
        reason: 'too_many_places',
        message: `Too packed! Reduce places or add days.`
      });
    }

    // Enrich Places
    async function enrichPlace(p){
      if(p.place_id && p.place_id.startsWith('custom_')){
        return p; 
      }
      
      const out = Object.assign({}, p);
      if(out.place_id){
        try{
          const fld = 'name,types,editorial_summary,opening_hours';
          const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${out.place_id}&fields=${fld}&key=${API}`;
          const r = await axios.get(url);
          const result = r.data.result || {};
          if(result.name) out.name = result.name;
          if(result.types) out.categories = result.types;
        } catch(e){ }
      }
      return out;
    }

    const enrichedPlaces = [];
    for(const p of selectedPlaces){
      enrichedPlaces.push(await enrichPlace(p));
    }

    // Basic TSP / Clustering
    const D = Math.max(1, Number(days) || 1);
    const buckets = Array.from({length: D}, ()=>[]);
    
    const currentDensity = enrichedPlaces.length / D;
    let effectiveDays = D;
    if (currentDensity < 2.0) {
       effectiveDays = Math.ceil(enrichedPlaces.length / IDEAL_PACE_PER_DAY);
       if(effectiveDays < 1) effectiveDays = 1;
    }

    for(let i=0; i<enrichedPlaces.length; i++){
      buckets[i % effectiveDays].push(enrichedPlaces[i]);
    }

    const plan = [];
    for(let di=0; di<D; di++){
      const dayPlaces = buckets[di] || [];
      
      if(dayPlaces.length === 0){
        plan.push({ day: di+1, places: [], isFreeDay: true });
        continue;
      }

      let la=0, ln=0;
      dayPlaces.forEach(p => { la += p.lat; ln += p.lng; });
      la /= dayPlaces.length; ln /= dayPlaces.length;

      let hotels = [];
      try{
        const hUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${la},${ln}&radius=7000&type=lodging&key=${API}`;
        const hr = await axios.get(hUrl);
        hotels = (hr.data.results || []).slice(0,5);
      } catch(e){}

      plan.push({
        day: di+1,
        places: dayPlaces,
        suggested_hotel: hotels[0] || null,
        isFreeDay: false
      });
    }

    return res.json({ status: 'ok', plan });

  } catch(e){
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));