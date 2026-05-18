const axios = require('axios');

const haversine = require('haversine-distance');
const { URLSearchParams } = require('url')
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const isCoordinate = (input) => {
const regex =
  /^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/;

  return regex.test(input);
};
const normalizeCoordinates = (input) => {
  const [a, b] = input
    .split(",")
    .map((v) => parseFloat(v.trim()));

  let lat;
  let lng;

  if (
    a >= -90 &&
    a <= 90 &&
    b >= -180 &&
    b <= 180
  ) {
    lat = a;
    lng = b;
  }

  else if (
    a >= -180 &&
    a <= 180 &&
    b >= -90 &&
    b <= 90
  ) {
    lng = a;
    lat = b;
  }

  else {
    throw new Error("Invalid coordinates");
  }

  return { lat, lng };
};
const geocodeAddress = async (address) => {
  try {
    const apiKey = process.env.GOONG_API_KEY;

    let url = "";
    let lat;
    let lng;

    if (isCoordinate(address)) {
      const { lat: inputLat, lng: inputLng } = normalizeCoordinates(address);
      lat = inputLat;
      lng = inputLng;

      url = `https://rsapi.goong.io/Geocode?latlng=${lat},${lng}&api_key=${apiKey}`;
    }

    else {
      url = `https://rsapi.goong.io/geocode?address=${encodeURIComponent(
        address
      )}&api_key=${apiKey}`;
    }

    const response = await axios.get(url);

    const results = response.data.results;
   
    if (!results || results.length === 0) {
      return null;
    }

    const result = results[0];
    if (!lat || !lng) {
      lat = result.geometry.location.lat;
      lng = result.geometry.location.lng;
    }  
    const analytics = await getLocationAnalytics(lat, lng);
    return {
      address: result.formatted_address,
      lat,
      lng,
      placeId: result.place_id,
      analytics: analytics || null
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

async function getLocationAnalytics(lat, lon, radius = 1000) {
    const origin = { latitude: lat, longitude: lon };
    const query = `
      [out:json][timeout:60];
      (
        nwr["highway"~"motorway|trunk|primary|secondary|tertiary|residential|service|living_street|unclassified"]
        (around:30,${lat},${lon});
        nwr["amenity"](around:${radius},${lat},${lon});
        nwr["shop"](around:${radius},${lat},${lon});
        nwr["tourism"](around:${radius},${lat},${lon});
        nwr["leisure"](around:${radius},${lat},${lon});
        nwr["landuse"="cemetery"](around:${radius},${lat},${lon});
        nwr["aeroway"="aerodrome"]
            (around:30000,${lat},${lon});
        nwr["railway"]
            (around:10000,${lat},${lon});
        nwr["landuse"="landfill"]
            (around:10000,${lat},${lon});
        nwr["leisure"="park"]
          (around:${radius},${lat},${lon});
      );
      out center;
      `;

    try {
        const params = new URLSearchParams();
        params.append('data', query);

        const response = await axios.post(OVERPASS_URL, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'NodeJS-Overpass-Client' 
            }
        });

        const elements = response.data.elements;
        if (!elements || elements.length === 0) return null;

        const results = {
            currentRoad: {
                name: "Không xác định",
                geocode: {longitude: lon, latitude: lat},
                type: "N/A",
                distance: Infinity
            },
            totalPOI: 0,
            businessDensity: 0,
            // networkDistance: 0,
            distance: {
              nearSchool: null,
              nearHospital: null,
              nearMarket: null,
              nearMall: null,
              nearCemetery: null,
              nearPagoda: null,
              nearAirport: null,
              nearRailway: null,
              nearLandfill: null,
              nearPark: null,
            },
            poiGroups: 0,
            nearbyHighways: new Set(),
        };
        const schools = [];
        const hospitals = [];
        const markets = [];
        const malls = [];
        const cemeteries = [];
        const pagodas = [];
        const airports = [];  
        const railways = [];
        const landfills = [];
        const parks = [];
        const poiGroups = {schools,hospitals,markets,malls,cemeteries,
                            pagodas,airports,railways,landfills,parks
                          };
        elements.forEach(el => {
            const tags = el.tags || {};

            const validRoadTypes = [
              "motorway",
              "trunk",
              "primary",
              "secondary",
              "tertiary",
              "residential",
              "service",
              "living_street",
              "unclassified"
            ];
            let dist = Infinity;

            if (el.geometry?.length) {

                dist = Math.min(
                    ...el.geometry.map(point =>
                        haversine(origin, {
                            latitude: point.lat,
                            longitude: point.lon
                        })
                    )
                );

            } else if (el.lat && el.lon) {

                dist = haversine(origin, {
                    latitude: el.lat,
                    longitude: el.lon
                });

            } else if (el.center) {

                dist = haversine(origin, {
                    latitude: el.center.lat,
                    longitude: el.center.lon
                });
            }

            if (
              validRoadTypes.includes(tags.highway)
            ) {

                results.nearbyHighways.add(tags.highway);

                if (dist < results.currentRoad.distance) {

                    results.currentRoad = {
                        name: tags.name || "Đường không tên/Hẻm",
                        type: tags.highway,
                        distance: dist
                    };
                }
            }

            // 2. POI
            if (
                tags.amenity ||
                tags.shop ||
                tags.tourism ||
                tags.leisure
            ) {
                results.totalPOI++;
            }
            if (
              tags.amenity === "school" ||
              tags.amenity === "college" ||
              tags.amenity === "university"
            ) {
              schools.push(el);
            }

            // HOSPITAL
            if (
              tags.amenity === "hospital" ||
              tags.amenity === "clinic"
            ) {
              hospitals.push(el);
            }

            // MARKET
            if (
              tags.amenity === "marketplace"
            ) {
              markets.push(el);
            }

            // MALL
            if (
              tags.shop === "mall"
            ) {
              malls.push(el);
            }
            // CEMETERY
            if (
              tags.landuse === "cemetery"
            ) {
              cemeteries.push(el);
            }
            // PAGODA
            if (
              tags.amenity === "place_of_worship"
            ) {
              pagodas.push(el);
            }
            // AIRPORT
            if (
              tags.aeroway === "aerodrome"
            ) {
              airports.push(el);
            }
            // RAILWAY
            if (
              tags.railway === "station"
            ) {
              railways.push(el);
            }
            // LANDFILL
            if (
              tags.landuse === "landfill"
            ) {
              landfills.push(el);
            }
            // PARK
            if (
              tags.leisure === "park"
            ) {
              parks.push(el);
            }
        });
        // 3. Clean Data 
        // results.networkDistance = Array.from(results.nearbyHighways);
        const areaKm2 = (Math.PI * Math.pow(radius / 1000, 2));
        results.businessDensity = (results.totalPOI / areaKm2).toFixed(2);

        const nearestSchool = getNearestDistance(
          schools,
          lat,
          lon
        );

        const nearestHospital = getNearestDistance(
          hospitals,
          lat,
          lon
        );

        const nearestMarket = getNearestDistance(
          markets,
          lat,
          lon
        );
        const nearestMall = getNearestDistance(
          malls,
          lat,
          lon
        );
        const nearestCemetery = getNearestDistance(
          cemeteries,
          lat,
          lon
        );
        const nearestPagoda = getNearestDistance(
          pagodas,
          lat,
          lon
        );
        const nearestAirport = getNearestDistance(
          airports,
          lat,  
          lon
        );
        const nearestRailway = getNearestDistance( 
          railways, 
          lat,
          lon
        );
        const nearestLandfill = getNearestDistance(
          landfills,
          lat,
          lon
        );
        const nearestPark = getNearestDistance(
          parks,
          lat,
          lon
        );
        results.distance.nearSchool =
          !nearestSchool || nearestSchool.distance === Infinity
            ? "Không tìm thấy trường học gần đó"
            : {
                name: nearestSchool.tags?.name || "Không tên",
                distance: `${nearestSchool.distance.toFixed(1)}m`,
                location: {
                  lat: nearestSchool.lat ?? nearestSchool.center?.lat,
                  lon: nearestSchool.lon ?? nearestSchool.center?.lon
                }
              };

        results.distance.nearHospital =
          !nearestHospital || nearestHospital.distance === Infinity
            ? "Không tìm thấy bệnh viện gần đó"
            : {
                name: nearestHospital.tags?.name || "Không tên",
                distance: `${nearestHospital.distance.toFixed(1)}m`,
                location: {
                  lat: nearestHospital.lat ?? nearestHospital.center?.lat,
                  lon: nearestHospital.lon ?? nearestHospital.center?.lon
                }
              };

        results.distance.nearMarket =
          !nearestMarket || nearestMarket.distance === Infinity
            ? "Không tìm thấy chợ gần đó"
            : {
                name: nearestMarket.tags?.name || "Không tên",
                distance: `${nearestMarket.distance.toFixed(1)}m`,
                location: {
                  lat: nearestMarket.lat ?? nearestMarket.center?.lat,
                  lon: nearestMarket.lon ?? nearestMarket.center?.lon
                }
              };

        results.distance.nearMall =
          !nearestMall || nearestMall.distance === Infinity
            ? "Không tìm thấy trung tâm thương mại gần đó"
            : {
                name: nearestMall.tags?.name || "Không tên",
                distance: `${nearestMall.distance.toFixed(1)}m`,
                location: {
                  lat: nearestMall.lat ?? nearestMall.center?.lat,
                  lon: nearestMall.lon ?? nearestMall.center?.lon
                }
              };

        results.distance.nearCemetery =
          !nearestCemetery || nearestCemetery.distance === Infinity
            ? "Không tìm thấy nghĩa địa gần đó"
            : {
                name: nearestCemetery.tags?.name || "Không tên",
                distance: `${nearestCemetery.distance.toFixed(1)}m`,
                location: {
                  lat: nearestCemetery.lat ?? nearestCemetery.center?.lat,
                  lon: nearestCemetery.lon ?? nearestCemetery.center?.lon
                }
              };

        results.distance.nearPagoda =
          !nearestPagoda || nearestPagoda.distance === Infinity
            ? "Không tìm thấy pagoda gần đó"
            : {
                name: nearestPagoda.tags?.name || "Không tên",
                distance: `${nearestPagoda.distance.toFixed(1)}m`,
                location: {
                  lat: nearestPagoda.lat ?? nearestPagoda.center?.lat,
                  lon: nearestPagoda.lon ?? nearestPagoda.center?.lon
                }
              };

        results.distance.nearAirport =
          !nearestAirport || nearestAirport.distance === Infinity
            ? "Không tìm thấy sân bay gần đó"
            : {
                name: nearestAirport.tags?.name || "Không tên",
                distance: `${nearestAirport.distance.toFixed(1)}m`,
                location: {
                  lat: nearestAirport.lat ?? nearestAirport.center?.lat,
                  lon: nearestAirport.lon ?? nearestAirport.center?.lon
                }
              };

        results.distance.nearRailway =
          !nearestRailway || nearestRailway.distance === Infinity
            ? "Không tìm thấy ga tàu gần đó"
            : {
                name: nearestRailway.tags?.name || "Không tên",
                distance: `${nearestRailway.distance.toFixed(1)}m`,
                location: {
                  lat: nearestRailway.lat ?? nearestRailway.center?.lat,
                  lon: nearestRailway.lon ?? nearestRailway.center?.lon
                }
              };

        results.distance.nearLandfill =
          !nearestLandfill || nearestLandfill.distance === Infinity
            ? "Không tìm thấy bãi rác gần đó"
            : {
                name: nearestLandfill.tags?.name || "Không tên",
                distance: `${nearestLandfill.distance.toFixed(1)}m`,
                location: {
                  lat: nearestLandfill.lat ?? nearestLandfill.center?.lat,
                  lon: nearestLandfill.lon ?? nearestLandfill.center?.lon
                }
              };
        results.distance.nearPark =
          !nearestPark || nearestPark.distance === Infinity
            ? "Không tìm thấy công viên gần đó"
            : {
                name: nearestPark.tags?.name || "Không tên",
                distance: `${nearestPark.distance.toFixed(1)}m`,
                location: {
                  lat: nearestPark.lat ?? nearestPark.center?.lat,
                  lon: nearestPark.lon ?? nearestPark.center?.lon
                }
              };
        //poiGroups
        results.poiGroups = Object.values(poiGroups).filter(arr => arr.length > 0).length;
        
        // Format lại khoảng cách trục đường chính
        if (results.currentRoad.distance === Infinity) {
            results.currentRoad = "Không tìm thấy trục đường sát cạnh";
        } else {
            results.currentRoad.distance = `${results.currentRoad.distance.toFixed(1)}m`;
        }

        return results;

    } catch (error) {
        console.error("Lỗi Overpass:", error.message);
        return null;
    }
}
function getNearestDistance(items, targetLat, targetLon) {
  if (!items || items.length === 0) {
    return null;
  }

  return items.reduce((min, item) => {
    const lat = item.lat ?? item.center?.lat;
    const lon = item.lon ?? item.center?.lon;

    // bỏ qua item không có tọa độ
    if (lat == null || lon == null) {
      return min;
    }

    const distance = haversine(
      { latitude: targetLat, longitude: targetLon },
      { latitude: lat, longitude: lon }
    );

     if (distance < min.distance) {
        return {
            ...item,
            distance
        };
    }

    return min;
  }, { distance: Infinity });
}
module.exports = {
  geocodeAddress,
};