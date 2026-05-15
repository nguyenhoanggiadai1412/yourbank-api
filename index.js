// const osmId = process.argv[2] || "27037936";
// function estimateFromHighwayType(type) {
//   const laneMap = {
//     motorway: 20, trunk: 15, primary: 12, 
//     secondary: 9, tertiary: 7, residential: 5
//   };
//   return laneMap[type] || 6;
// }
// async function runTest(id) {
//   console.log(`--- Đang kiểm tra Way ID: ${id} ---`);

//   try {
//     const q = `[out:json][timeout:25];way(${id});out tags;`;
//     const url = "https://overpass-api.de/api/interpreter?data="+ encodeURIComponent(q);

//     const res = await fetch(url, {
//       headers: {
//         "User-Agent": "OSM-Way-Checker/1.0"
//       }
//     });

//     const contentType = res.headers.get("content-type") || "";
//     if (!contentType.includes("application/json")) {
//         const text = await res.text();
//         throw new Error("Overpass không trả JSON: " + text.slice(0, 200));
//     }

//     const data = await res.json();

//     if (!data.elements || data.elements.length === 0) {
//         throw new Error(`Không tìm thấy thông tin cho Way ID: ${id}`);
//     }

//     const tags = data.elements[0].tags || {};

//     const highway = tags.highway ;
//     let lanes = tags.lanes;
//     let width = tags.width;


//     console.table({
//       "OSM ID": id,
//       "Highway": highway,
//       "Lanes": lanes,
//       "Width": width
//     });

//   } catch (error) {
//     console.error("Lỗi thực thi:");
//     console.error(error.message);
//   }
// }
// // async function runTestStreet(id) {
// //     try {
// //         const name = "Lê Văn Sỹ";

// //         const q = `[out:json][timeout:25];way["name"="${name}"]["highway"](10.78,106.66,10.80,106.69);out tags;`;
// //         const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(q);

// //         const res = await fetch(url, { headers: { 'User-Agent': 'OSM_Width_Checker/1.0' } });
// //         const data = await res.json();
        
// //         const elements = data.elements || [];

// //         if (elements.length === 0) {
// //             throw new Error(`Không tìm thấy dữ liệu cho đường "${name}" trong khu vực này.`);
// //         }

// //         const widths = elements
// //             .filter(e => e.tags && e.tags.width)
// //             .map(e => parseFloat(e.tags.width));

// //         let avgWidth;
// //         if (widths.length > 0) {
// //             avgWidth = Math.round(widths.reduce((a, b) => a + b) / widths.length);
// //         } else {
// //             const firstHighwayType = elements[0].tags.highway;
// //             avgWidth = estimateFromHighwayType(firstHighwayType);
// //         }

// //         console.log(`Đoạn đường "${name}" có chiều rộng ước tính: ${avgWidth}m`);
// //     } catch (error) {
// //         console.error("Lỗi thực thi:");
// //         console.error(error.message);
// //     }
// // }
// runTest(osmId);

require("dotenv").config();

const app = require("./src/app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// const axios = require('axios');

// /**
//  * CẤU HÌNH CÁC THAM SỐ
//  */
// const CONFIG = {
//     ORIGIN: { lat: 10.7721, lon: 106.7062 }, // Tọa độ Bitexco, TP.HCM
//     RADIUS: 500, // Bán kính tìm kiếm (mét)
//     POI_TYPE: 'amenity=cafe', // Loại POI muốn tìm (ví dụ: quán cafe)
//     OVERPASS_URL: "https://overpass-api.de/api/interpreter",
//     OSRM_URL: "http://router.project-osrm.org/table/v1/driving/"
// };

// /**
//  * BƯỚC 1: Lấy danh sách POI từ Overpass API
//  */
// async function getNearbyPOIs(lat, lon, radius, type) {
//     console.log(`--- Đang tìm POI (${type}) trong bán kính ${radius}m ---`);
    
//     const query = `[out:json][timeout:25];(node[${type}](around:${radius},${lat},${lon});way[${type}](around:${radius},${lat},${lon}););out center;`;

//     try {
//         const response = await axios({
//             method: 'post',
//             url: CONFIG.OVERPASS_URL,
//             data: `data=${encodeURIComponent(query)}`,
//             headers: {
//                 'Accept': 'application/json, text/javascript, */*; q=0.01',
//                 'Accept-Encoding': 'gzip, deflate, br',
//                 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
//                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
//                 'Origin': 'https://overpass-turbo.eu', 
//                 'Referer': 'https://overpass-turbo.eu/'
//             },
//             decompress: true 
//         });

//         if (!response.data || !response.data.elements) {
//             console.log("Dữ liệu trống:", response.data);
//             return [];
//         }

//         const pois = response.data.elements.map(el => ({
//             name: el.tags.name || "Không tên",
//             lat: el.lat || (el.center ? el.center.lat : null),
//             lon: el.lon || (el.center ? el.center.lon : null)
//         })).filter(p => p.lat && p.lon); // Loại bỏ POI lỗi tọa độ

//         console.log(`Tìm thấy ${pois.length} POI.`);
//         return pois;
//     } catch (error) {
//         if (error.response) {
//             console.error(`Lỗi Overpass (Status ${error.response.status})`);
//             // if error 403 print response body for debugging
//             // console.error(error.response.headers);
//         } else {
//             console.error("Lỗi kết nối:", error.message);
//         }
//         return [];
//     }
// }

// async function calculateRealDistances(origin, pois) {
//     if (pois.length === 0) return [];

//     console.log(`--- Đang tính toán đường bộ đến ${pois.length} địa điểm ---`);

//     const coordinates = [
//         `${origin.lon},${origin.lat}`,
//         ...pois.map(p => `${p.lon},${p.lat}`)
//     ].join(';');

//     try {
//         const url = `${CONFIG.OSRM_URL}${coordinates}?sources=0&annotations=distance,duration`;
//         const response = await axios.get(url);

//         const distances = response.data.distances[0]; 
//         const durations = response.data.durations[0]; 

//         // Gộp dữ liệu vào danh sách POI ban đầu
//         return pois.map((poi, index) => ({
//             ...poi,
//             roadDistance: distances[index + 1], // +1 vì index 0 là chính nó
//             duration: Math.round(durations[index + 1] / 60) 
//         }));
//     } catch (error) {
//         console.error("Lỗi OSRM:", error.message);
//         return pois;
//     }
// }

// async function runTest() {
//     try {
//         // 1. Tìm POI
//         const pois = await getNearbyPOIs(CONFIG.ORIGIN.lat, CONFIG.ORIGIN.lon, CONFIG.RADIUS, CONFIG.POI_TYPE);
        
//         if (pois.length === 0) {
//             console.log("Không tìm thấy POI nào quanh đây.");
//             return;
//         }

//         // 2. Tính khoảng cách thực tế
//         const results = await calculateRealDistances(CONFIG.ORIGIN, pois);

//         // 3. Hiển thị kết quả
//         console.table(results.map(r => ({
//             "Tên": r.name,
//             "Khoảng cách (m)": r.roadDistance.toFixed(0),
//             "Thời gian đi xe (phút)": r.duration
//         })));

//     } catch (err) {
//         console.error("Lỗi hệ thống:", err);
//     }
// }

// runTest();