function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // mét

  const toRad = (deg) => deg * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const center = {
  lat: 10.7769,
  lon: 106.7009
};

const points = [
  { id: 1, lat: 10.7771, lon: 106.7012 },
  { id: 2, lat: 10.7810, lon: 106.7100 },
  { id: 3, lat: 10.7765, lon: 106.7005 },
];

const nearby = points.filter(p => {
  const distance = haversine(
    center.lat,
    center.lon,
    p.lat,
    p.lon
  );

  return distance <= 500; // trong bán kính 500m
});

console.log(nearby);