const fs = require("fs");
const cache = JSON.parse(fs.readFileSync("./queermed-distance-cache/cache.json"));

const R = 6371.0088; // Earth's mean radius in km
const toRad = degrees => degrees * Math.PI / 180;

function getDistance(coord1, coord2) {
  if (coord1 == null || coord2 == null) {
    return null;
  }
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = (
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(rLat1) * Math.cos(rLat2) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  );

  return Math.round(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getCities() {
  return cache.cities.map(c => ({ "name": c.name, "id": c.id }));
}

function getCategories() {
  return cache.categories;
}

function search(city, categories) {
  const location = cache.cities.find(c => c.id == city)?.coords;
  if (location == null) return null;
  for (const cat of categories) {
    if (!cache.categories.some(c => c.id == cat)) return null;
  }
  const filtered = [];
  for (const doc of cache.doctors) {
    if (categories.length > 0 && !doc.categories.some(c => categories.includes(c))) continue;
    let distance;
    if (doc.city == null) {
      distance = 0;
    } else {
      distance = getDistance(location, doc.coords);
    }
    filtered.push({ "name": doc.name, "city": doc.city, "categories": doc.categories, "url": doc.url, distance });
  }
  filtered.sort((a, b) => a.distance - b.distance);
  return filtered;
}

module.exports = { getCities, getCategories, search };
