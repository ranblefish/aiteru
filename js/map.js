// Supabaseクライアントの初期化
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 地図の初期化
let map = L.map('map').setView([35.6894, 139.6917], 13);

// OpenStreetMapのタイルレイヤーを追加
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// 現在位置を取得して地図の中心を設定
function setCurrentLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            map.setView([lat, lon], 15);
            loadNearbyHotels(lat, lon);
        });
    }
}

// 近くのホテルを読み込む
async function loadNearbyHotels(lat, lon) {
    try {
        const { data, error } = await supabase
            .from('hotels')
            .select(`
                *,
                rooms (
                    status
                )
            `);

        if (error) throw error;

        data.forEach(hotel => {
            addHotelToMap(hotel);
        });
    } catch (error) {
        console.error('Error loading hotels:', error);
    }
}

// ホテルをマップに追加
function addHotelToMap(hotel) {
    // 空室状況を確認
    const hasVacancy = hotel.rooms.some(room => room.status === 'vacant');
    
    // マーカーの色を設定
    const markerColor = hasVacancy ? 'blue' : 'red';
    
    // マーカーを作成
    const marker = L.marker([hotel.latitude, hotel.longitude], {
        icon: L.divIcon({
            className: `hotel-marker ${hasVacancy ? 'vacant' : 'occupied'}`,
            html: `<div style="background-color: ${markerColor}; width: 10px; height: 10px; border-radius: 50%;"></div>`,
            iconSize: [10, 10]
        })
    });

    // ポップアップの内容を設定
    const popupContent = `
        <div class="hotel-info">
            <h3>${hotel.name}</h3>
            <p>${hotel.address}</p>
            <p>電話: <a href="tel:${hotel.phone}">${hotel.phone}</a></p>
            <p class="vacancy-status ${hasVacancy ? 'vacant' : 'occupied'}">
                ${hasVacancy ? '空室あり' : '満室'}
            </p>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${hotel.latitude},${hotel.longitude}" 
               class="button" 
               target="_blank">
               ここまでの道順
            </a>
        </div>
    `;

    marker.bindPopup(popupContent);
    marker.addTo(map);
}

// 地図の初期化時に現在位置を設定
setCurrentLocation();