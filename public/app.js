let map;
let currentDestination = null;

// Markers
let searchMarkers = []; 
let itineraryMarkers = {}; 

// Route Renderers
let currentDirectionsRenderers = [];

// Data
let selectedAttractions = [];
let selectedHotels = [];
let selectedHotelPerDay = {}; 

// Fallback image
const FALLBACK_IMAGE = 'https://placehold.co/400x300?text=No+Image+Available';

// Views
const views = {
  search: document.getElementById('step-search'),
  attractions: document.getElementById('step-attractions'),
  hotels: document.getElementById('step-hotels'),
  itinerary: document.getElementById('step-itinerary')
};

const destInput = document.getElementById('destInput');
const suggestionsBox = document.getElementById('destSuggestions');
const yourListContainer = document.getElementById('yourList');
const countSpan = document.getElementById('attractionCount');

// --- MAP INIT ---
window.initMap = function() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 20.5937, lng: 78.9629 },
    zoom: 5,
    disableDefaultUI: true,
    zoomControl: true,
    styles: [
      { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
    ]
  });
};

// --- HELPER: DYNAMIC MAP MOVEMENT ---
function fitMapToSelection() {
  const allItems = [...selectedAttractions, ...selectedHotels];
  
  // If list is empty, return to the main destination center
  if (allItems.length === 0) {
    if (currentDestination) {
      map.panTo({ lat: currentDestination.lat, lng: currentDestination.lng });
      map.setZoom(13);
    }
    return;
  }

  // If only one item, pan to it directly
  if (allItems.length === 1) {
    map.panTo({ lat: allItems[0].lat, lng: allItems[0].lng });
    map.setZoom(14);
    return;
  }

  // Fit bounds to show all remaining items
  const bounds = new google.maps.LatLngBounds();
  allItems.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
  
  // Add some padding so pins aren't on the very edge
  map.fitBounds(bounds, {
    top: 50, bottom: 50, left: 50, right: 50
  });
}

// --- ROUTE DRAWING FUNCTION ---
async function drawDayRouteOnMap(dayPlaces) {
  return new Promise((resolve, reject) => {
    if (!dayPlaces || dayPlaces.length < 2) {
      resolve(null);
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true,
      preserveViewport: false
    });

    currentDirectionsRenderers.push(directionsRenderer);

    const origin = { lat: dayPlaces[0].lat, lng: dayPlaces[0].lng };
    const destination = { lat: dayPlaces[dayPlaces.length - 1].lat, lng: dayPlaces[dayPlaces.length - 1].lng };

    const waypoints = dayPlaces.slice(1, -1).map(p => ({
      location: { lat: p.lat, lng: p.lng },
      stopover: true
    }));

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (result, status) => {
        if (status === "OK") {
          directionsRenderer.setDirections(result);
          const legs = result.routes[0].legs.map(leg => ({
            from: leg.start_address,
            to: leg.end_address,
            distance_text: leg.distance.text,
            duration_text: leg.duration.text,
            duration_value: leg.duration.value 
          }));
          resolve(legs);
        } else {
          resolve(null); 
        }
      }
    );
  });
}

function clearRoutes() {
  currentDirectionsRenderers.forEach(r => r.setMap(null));
  currentDirectionsRenderers = [];
}

// --- MARKER MANAGEMENT ---
function clearSearchMarkers() {
  searchMarkers.forEach(m => m.setMap(null));
  searchMarkers = [];
}

function addItineraryMarker(item, type) {
  if (itineraryMarkers[item.id]) return; 

  const isHotel = type === 'hotel';
  const iconUrl = isHotel 
    ? "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" 
    : "http://maps.google.com/mapfiles/ms/icons/red-dot.png";

  const marker = new google.maps.Marker({
    position: { lat: item.lat, lng: item.lng },
    map: map,
    title: item.name,
    icon: { url: iconUrl },
    animation: google.maps.Animation.DROP
  });

  const infoWindow = new google.maps.InfoWindow({
    content: `<strong>${item.name}</strong><br>✅ Added to Itinerary`
  });

  marker.addListener("click", () => infoWindow.open(map, marker));
  itineraryMarkers[item.id] = marker;
}

function removeItineraryMarker(id) {
  if (itineraryMarkers[id]) {
    itineraryMarkers[id].setMap(null);
    delete itineraryMarkers[id];
  }
}

// --- VIEW SWITCHING ---
function switchView(viewName) {
  Object.keys(views).forEach(key => {
    views[key].style.display = (key === viewName) ? 'flex' : 'none';
  });
}

// --- STEP 1: SEARCH ---
let debounceTimer;
destInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  const query = destInput.value.trim();
  
  if (query.length < 3) { suggestionsBox.innerHTML = ''; return; }

  debounceTimer = setTimeout(async () => {
    suggestionsBox.innerHTML = '<div class="suggestion-item">🔍 Searching...</div>';
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      suggestionsBox.innerHTML = '';
      
      if (!data.results || data.results.length === 0) {
        suggestionsBox.innerHTML = '<div class="suggestion-item">No results found</div>';
        return;
      }

      data.results.forEach(place => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `<strong>${place.name}</strong> <span style="color:#999; font-size:0.8em">${place.formatted_address}</span>`;
        item.addEventListener('click', () => selectDestination(place));
        suggestionsBox.appendChild(item);
      });
    } catch (err) {
      suggestionsBox.innerHTML = '<div class="suggestion-item">❌ Search failed</div>';
    }
  }, 300);
});

async function selectDestination(place) {
  currentDestination = place;
  destInput.value = place.name;
  suggestionsBox.innerHTML = '';
  document.getElementById('cityName').textContent = place.name;
  
  map.setCenter({ lat: place.lat, lng: place.lng });
  map.setZoom(13);
  
  clearSearchMarkers();
  clearRoutes();
  Object.keys(itineraryMarkers).forEach(id => removeItineraryMarker(id));
  selectedAttractions = [];
  selectedHotels = [];
  updateListUI();
  
  new google.maps.Marker({
    position: { lat: place.lat, lng: place.lng },
    map: map,
    icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
    title: "Destination"
  });

  switchView('attractions');
  await loadCategories();
  loadPlacesForCategory('tourist_attraction'); 
}

// --- STEP 2: ATTRACTIONS ---
async function loadCategories() {
  const container = document.getElementById('categoriesBox');
  container.innerHTML = ''; 

  try {
    const res = await fetch(`/api/categories?lat=${currentDestination.lat}&lng=${currentDestination.lng}`);
    const data = await res.json();
    
    data.categories.forEach(cat => {
      const btn = document.createElement('div');
      btn.className = 'cat-pill';
      btn.textContent = cat.label;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadPlacesForCategory(cat.type);
      });
      container.appendChild(btn);
    });
  } catch (err) { console.error(err); }
}

async function loadPlacesForCategory(placeType) {
  const container = document.getElementById('placesResults');
  container.innerHTML = '<p class="loading" style="padding:20px; text-align:center; color:#666;">⏳ Finding best spots...</p>';
  
  try {
    const res = await fetch(`/api/places?lat=${currentDestination.lat}&lng=${currentDestination.lng}&type=${encodeURIComponent(placeType)}`);
    const data = await res.json();

    container.innerHTML = '';

    if (!data.results || data.results.length === 0) {
      container.innerHTML = '<p class="error" style="padding:20px; text-align:center;">⚠️ No places found.</p>';
      return;
    }

    data.results.forEach(place => {
      container.appendChild(createPlaceCard(place, 'attraction'));
    });
  } catch (err) {
    container.innerHTML = '<p class="error">❌ Failed to load places.</p>';
  }
}

// --- STEP 3: HOTELS ---
document.getElementById('btnToHotels').addEventListener('click', async () => {
  switchView('hotels');

  let targetLat = currentDestination.lat;
  let targetLng = currentDestination.lng;

  if (selectedAttractions.length > 0) {
    let latSum = 0, lngSum = 0;
    selectedAttractions.forEach(p => { latSum += p.lat; lngSum += p.lng; });
    targetLat = latSum / selectedAttractions.length;
    targetLng = lngSum / selectedAttractions.length;
  }

  const box = document.getElementById('hotelsResults');
  box.innerHTML = '<p class="loading">🏨 Finding hotels...</p>';

  try {
    const res = await fetch(`/api/hotels?lat=${targetLat}&lng=${targetLng}`);
    const data = await res.json();
    box.innerHTML = '';

    if (!data.results || data.results.length === 0) {
      box.innerHTML = '<p class="error">⚠️ No hotels found.</p>';
      return;
    }

    data.results.forEach(hotel => {
      box.appendChild(createPlaceCard(hotel, 'hotel'));
    });
  } catch (err) {
    box.innerHTML = '<p class="error">❌ Failed to load hotels.</p>';
  }
});

document.getElementById('btnBackToAttr').addEventListener('click', () => {
  switchView('attractions');
});

document.getElementById('btnEditItinerary').addEventListener('click', () => {
  switchView('attractions');
});

// --- LIST MANAGEMENT (WITH DYNAMIC MAP & VERIFICATION) ---
function createPlaceCard(place, type) {
  const div = document.createElement('div');
  div.className = 'place-card';
  
  const isSelected = type === 'attraction' 
    ? selectedAttractions.some(i => i.id === place.place_id)
    : selectedHotels.some(i => i.id === place.place_id);

  // --- SMART IMAGE LOGIC ---
  let primaryUrl;
  let fallbackKeyword = encodeURIComponent(place.name + " " + (place.address || ""));

  if (place.photo_ref && place.photo_ref.startsWith('LOCAL:')) {
     const cleanName = place.photo_ref.replace('LOCAL:/images/', '').split('/').pop().split('.')[0];
     primaryUrl = `https://placehold.co/400x300?text=${encodeURIComponent(cleanName)}`;
  } else if (place.photo_ref) {
     primaryUrl = `/api/photo?ref=${encodeURIComponent(place.photo_ref)}`;
  } else {
     primaryUrl = `/api/photo?keyword=${fallbackKeyword}`;
  }

  const imgErrorLogic = `
    if (this.src.includes('ref=')) { 
      this.src = '/api/photo?keyword=${fallbackKeyword}'; 
    } else { 
      this.onerror = null; 
      this.src = '${FALLBACK_IMAGE}'; 
    }
  `;

  div.innerHTML = `
    <img src="${primaryUrl}" class="card-img" alt="${place.name}" onerror="${imgErrorLogic}">
    <div class="card-info">
      <h3>${place.name}</h3>
      <div class="card-rating">⭐ ${place.rating || 'N/A'} <span style="color:#888">(${place.user_ratings_total || 0})</span></div>
      <div class="card-meta">📍 ${place.distance_km ? place.distance_km.toFixed(1) + ' km away' : place.address}</div>
      <div class="card-actions">
        <button class="btn btn-sm btn-primary add-btn" ${isSelected ? 'disabled' : ''}>
          ${isSelected ? 'Added ✓' : 'Add +'}
        </button>
      </div>
    </div>
  `;

  const addBtn = div.querySelector('.add-btn');
  addBtn.addEventListener('click', async () => {
    addBtn.disabled = true;
    const originalText = addBtn.textContent;
    addBtn.textContent = 'Verifying...'; 

    const success = await addPlaceToData(place, type);

    if (success) {
      addBtn.textContent = 'Added ✓';
      addBtn.classList.remove('btn-primary');
      addBtn.classList.add('btn-success');
    } else {
      addBtn.textContent = originalText;
      addBtn.disabled = false;
      alert("Could not verify location details.");
    }
  });

  return div;
}

async function addPlaceToData(place, type) {
  let finalPlace = { ...place };

  // Resolve Custom Places to Google Places
  if (place.place_id && place.place_id.startsWith('custom_')) {
    try {
      const res = await fetch(`/api/resolve-place?name=${encodeURIComponent(place.name)}&location=${encodeURIComponent(place.address)}`);
      const realData = await res.json();

      if (realData.found) {
        console.log(`📍 Fixed location for ${place.name}:`, realData);
        finalPlace.place_id = realData.place_id;
        finalPlace.lat = realData.lat;
        finalPlace.lng = realData.lng;
      } else {
        console.warn(`⚠️ Google couldn't find "${place.name}". Using custom coordinates.`);
      }
    } catch (err) {
      console.error("Error resolving place:", err);
    }
  }

  const item = { 
    id: finalPlace.place_id, 
    name: finalPlace.name, 
    lat: finalPlace.lat, 
    lng: finalPlace.lng, 
    type: type,
    types: finalPlace.types || [],
    photo_ref: finalPlace.photo_ref || null
  };
  
  if (type === 'attraction') selectedAttractions.push(item);
  else selectedHotels.push(item);
  
  addItineraryMarker(item, type); 
  updateListUI();

  // DYNAMIC MAP: Pan and Zoom to the new addition!
  map.panTo({ lat: item.lat, lng: item.lng });
  map.setZoom(15);

  return true; 
}

function removePlaceFromData(id, type) {
  const markerTitle = itineraryMarkers[id] ? itineraryMarkers[id].getTitle() : null;

  if (type === 'attraction') {
    selectedAttractions = selectedAttractions.filter(i => i.id !== id);
  } else {
    selectedHotels = selectedHotels.filter(i => i.id !== id);
  }
  
  removeItineraryMarker(id); 
  updateListUI();
  
  if (markerTitle) {
    const cards = document.querySelectorAll('.place-card');
    cards.forEach(card => {
      const titleEl = card.querySelector('h3');
      if (titleEl && titleEl.textContent === markerTitle) {
         const addBtn = card.querySelector('.add-btn');
         if(addBtn) {
           addBtn.textContent = 'Add +';
           addBtn.disabled = false;
           addBtn.classList.remove('btn-success');
           addBtn.classList.add('btn-primary');
         }
      }
    });
  }

  // DYNAMIC MAP: Re-fit bounds to show what's remaining
  fitMapToSelection();
}

function updateListUI() {
  const total = selectedAttractions.length + selectedHotels.length;
  countSpan.textContent = total;
  yourListContainer.innerHTML = '';
  
  const allItems = [...selectedAttractions, ...selectedHotels];
  
  allItems.forEach(item => {
    const div = document.createElement('div');
    div.className = 'mini-item';
    const dotColor = item.type === 'hotel' ? '#3b82f6' : '#ef4444';
    div.innerHTML = `
      <div style="display:flex; align-items:center;">
        <span style="height:8px; width:8px; background:${dotColor}; border-radius:50%; margin-right:6px;"></span>
        <span>${item.name}</span>
      </div>
      <button class="remove-btn" onclick="removePlaceFromData('${item.id}', '${item.type}')">×</button>
    `;
    yourListContainer.appendChild(div);
  });
}

window.removePlaceFromData = removePlaceFromData;

// --- STEP 4: FINISH & GENERATE ---
document.getElementById('btnFinish').addEventListener('click', async () => {
  const startDateInput = document.getElementById('startDate') ? document.getElementById('startDate').value : null;
  const endDateInput = document.getElementById('endDate') ? document.getElementById('endDate').value : null;
  
  if (!startDateInput || !endDateInput) {
    alert("⚠️ Please select Start and End dates for your trip.");
    return;
  }

  let days = 0;
  if (startDateInput && endDateInput) {
    const start = new Date(startDateInput);
    const end = new Date(endDateInput);
    const diffTime = Math.abs(end - start);
    days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
  }

  const btn = document.getElementById('btnFinish');
  const originalText = btn.textContent;
  btn.textContent = "Checking Feasibility...";
  btn.disabled = true;

  try {
    const payload = {
      selectedPlaces: selectedAttractions, 
      startDate: startDateInput || null,
      endDate: endDateInput || null,
      days: days
    };

    const res = await fetch('/api/plan', {
      method:'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if(data && data.status === 'failed' && data.reason === 'too_many_places'){
       alert(data.message);
       return;
    }

    const planFromServer = data.plan || [];
    selectedHotelPerDay = {};
    
    switchView('itinerary'); 
    await renderSuggestedDays(planFromServer);

  } catch (err) {
    console.error(err);
    alert("❌ Error connecting to server.");
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
});

// --- RENDER ITINERARY WITH ROUTING ---
async function renderSuggestedDays(plan) {
  const container = document.getElementById('finalItineraryContainer');
  container.innerHTML = '';
  clearRoutes();

  if (!plan || plan.length === 0) {
      container.innerHTML = '<div style="padding:20px;">No plan generated.</div>';
      return;
  }

  for (const dayPlan of plan) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day-block';
    
    // Handle Free Days
    if (dayPlan.isFreeDay) {
       dayDiv.innerHTML = `
        <div class="day-header" style="border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:15px;">
           <span style="font-size:1.4em; font-weight:bold; color:#10b981;">Day ${dayPlan.day} (Free Day)</span>
        </div>
        <div style="padding:20px; text-align:center; background:#f0fdf4; border:1px dashed #10b981; border-radius:12px; color:#047857;">
           🌿 <strong>Relax!</strong> This day is open for leisure, shopping, or spontaneous exploration.
        </div>
      `;
      container.appendChild(dayDiv);
      continue;
    }
    
    const places = dayPlan.places || [];
    
    // --- 1. BUILD THE WHOLE DAY ROUTE URL (From Current Location) ---
    // Universal Google Maps "dir" URL. 
    // Logic: Start from "Current Location" (by omitting origin), then visit points in order.
    // The last point is 'destination', previous points are 'waypoints'.
    
    let routeUrl = '#';
    const baseUrl = "https://www.google.com/maps/dir/?api=1"; // STANDARD GOOGLE MAPS URL

    if(places.length > 0) {
       const dest = places[places.length - 1];
       const destinationParam = `&destination=${dest.lat},${dest.lng}&destination_place_id=${dest.id || ''}`;
       
       let waypointsParam = '';
       if (places.length > 1) {
          // Use all points except the last one as waypoints
          const wpList = places.slice(0, -1).map(p => `${p.lat},${p.lng}`);
          waypointsParam = `&waypoints=${wpList.join('|')}`;
       }

       // We omit 'origin' so it defaults to "My Location"
       routeUrl = `${baseUrl}${destinationParam}${waypointsParam}&travelmode=driving`;
    }

    const travelLegs = await drawDayRouteOnMap(places);
    let placesHtml = '';
    
    places.forEach((p, index) => {
      // --- 2. BUILD SINGLE PLACE NAVIGATION URL ---
      // FIX: Use standard Google Maps URL with no origin (defaults to live location)
      const placeNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&destination_place_id=${p.id || ''}&travelmode=driving`;
      
      // --- SMART IMAGE LOGIC FOR ITINERARY ---
      let primaryUrl;
      let fallbackKeyword = encodeURIComponent(p.name);

      if (p.photo_ref && p.photo_ref.startsWith('LOCAL:')) {
         const cleanName = p.photo_ref.replace('LOCAL:/images/', '').split('/').pop().split('.')[0];
         primaryUrl = `https://placehold.co/400x300?text=${encodeURIComponent(cleanName)}`;
      } else if (p.photo_ref) {
         primaryUrl = `/api/photo?ref=${encodeURIComponent(p.photo_ref)}`;
      } else {
         primaryUrl = `/api/photo?keyword=${fallbackKeyword}`;
      }

      const imgErrorLogic = `
        if (this.src.includes('ref=')) { 
          this.src = '/api/photo?keyword=${fallbackKeyword}'; 
        } else { 
          this.onerror = null; 
          this.src = '${FALLBACK_IMAGE}'; 
        }
      `;

      placesHtml += `
        <div class="itinerary-card">
          <div class="it-card-image-container">
             <img src="${primaryUrl}" class="it-card-image" alt="${p.name}" onerror="${imgErrorLogic}">
          </div>
          <div class="it-card-content">
             <div class="it-card-title">${p.name}</div>
             <div class="it-card-desc" style="font-size:0.8rem; color:#666; margin-bottom:6px;">${p.types?.[0] || 'Activity'}</div>
             <div class="it-card-meta-row">
                <span class="time-pill">Duration: ${p.estimated_duration || 1}h</span>
             </div>
             <div style="margin-top:8px;">
                <a href="${placeNavUrl}" target="_blank" class="btn btn-sm btn-secondary" style="text-decoration:none; font-size:0.8rem;">📍 Navigate</a>
             </div>
          </div>
        </div>
      `;

      if (travelLegs && travelLegs[index]) {
        placesHtml += `
          <div style="padding-left: 50px; margin: 8px 0; color: #666; font-size: 0.85em; display: flex; align-items: center;">
             <span style="border-left: 2px dashed #ccc; height: 15px; margin-right: 10px;"></span>
             🚗 Drive: <strong>${travelLegs[index].duration_text}</strong> <span style="color:#888; margin-left:5px;">(${travelLegs[index].distance_text})</span>
          </div>
        `;
      }
    });

    dayDiv.innerHTML = `
      <div class="day-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
         <span style="font-size:1.4em; font-weight:bold; color:#3b82f6;">Day ${dayPlan.day}</span>
         <a href="${routeUrl}" target="_blank" class="btn btn-sm btn-primary" style="text-decoration:none;">
            🚀 Map Route
         </a>
      </div>
      <div class="day-items">${placesHtml}</div>
    `;
    container.appendChild(dayDiv);
  }
}