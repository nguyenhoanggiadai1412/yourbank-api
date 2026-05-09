const axios = require('axios');

const haversine = require('haversine-distance');
const { URLSearchParams } = require('url')
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const geocodeAddress = async (address) => {
  try {
    const apiKey = process.env.GOONG_API_KEY;

    const url = `https://rsapi.goong.io/geocode?address=${encodeURIComponent(
      address
    )}&api_key=${apiKey}`;

    const response = await axios.get(url);

    const results = response.data.results;
   
    if (!results || results.length === 0) {
      return null;
    }

    const result = results[0];
    const lat = result.geometry.location.lat;
    const lng = result.geometry.location.lng;
    const analytics = await getLocationAnalytics(lat, lng);
    return {
      address: result.formatted_address,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      placeId: result.place_id,
      analytics: analytics || null
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

async function getLocationAnalytics(lat, lon, radius = 500) {
    const origin = { latitude: lat, longitude: lon };

    // Cập nhật Query: 
    // - Nhóm 1 (streets): Tìm đường trong bán kính cực hẹp (20m) để xác định trục đường chính của địa điểm
    // - Nhóm 2 (pois): Tìm tiện ích xung quanh trong bán kính rộng (500m)
    const query = `
    [out:json][timeout:30];
    (
      way["highway"](around:20, ${lat}, ${lon});
    )->.address_street;
    (
      node["shop"](around:${radius}, ${lat}, ${lon});
      node["amenity"](around:${radius}, ${lat}, ${lon});
      way["shop"](around:${radius}, ${lat}, ${lon});
      way["amenity"](around:${radius}, ${lat}, ${lon});
    )->.pois;
    (.address_street; .pois;);
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
                type: "N/A",
                distance: Infinity
            },
            businessPOI: [],
            amenities: {},
            businessDensity: 0,
            nearbyHighways: new Set() // Lưu các loại đường khác xung quanh
        };

        elements.forEach(el => {
            const tags = el.tags || {};
            const targetCoords = el.lat ? { latitude: el.lat, longitude: el.lon } : 
                                 (el.center ? { latitude: el.center.lat, longitude: el.center.lon } : null);
            if (!targetCoords) return;

            const dist = haversine(origin, targetCoords);

            // 1. XỬ LÝ TRỤC ĐƯỜNG CỦA ĐỊA ĐIỂM (Dựa vào khoảng cách gần nhất < 20m)
            if (tags.highway) {
                results.nearbyHighways.add(tags.highway);
                
                // Nếu đường này gần tọa độ gốc hơn con đường đã lưu trước đó
                if (dist < results.currentRoad.distance) {
                    results.currentRoad = {
                        name: tags.name || "Đường không tên/Hẻm",
                        type: tags.highway,
                        distance: dist
                    };
                }
            }

            // 2. XỬ LÝ POI & TIỆN ÍCH (Bán kính rộng)
            if (tags.shop || tags.amenity) {
                results.businessPOI.push({
                    name: tags.name || "Không tên",
                    type: tags.shop || tags.amenity,
                    distance: dist
                });

                const group = tags.amenity || "shop";
                results.amenities[group] = (results.amenities[group] || 0) + 1;
            }
        });

        // 3. TỔNG HỢP & LÀM SẠCH DỮ LIỆU
        results.nearbyHighways = Array.from(results.nearbyHighways);
        const areaKm2 = (Math.PI * Math.pow(radius / 1000, 2));
        results.businessDensity = (results.businessPOI.length / areaKm2).toFixed(2);
        
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

module.exports = {
  geocodeAddress,
};