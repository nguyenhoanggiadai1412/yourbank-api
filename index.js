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
