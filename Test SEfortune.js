// 每日運勢資料庫
const fortuneData = {
    travel: [
        "適合前往水源地或安靜的咖啡廳，藍色配件能提升你的偏財運。",
        "今天適合到大自然中行走，森林的芬多精能淨化你的磁場。",
        "適合待在安靜的室內空間，午後的一杯熱茶會帶來靈感。",
        "遠行有貴人相助，特別是往北方走會有意外驚喜。",
        "建議穿上淺紫色衣物出門，能有效避開今日的小口角。",
        "在有藝術氣息的地方逗留，會讓你發現意想不到的商機。"
    ],
    love: [
        "桃花運極佳，今天適合主動出擊或是參與社交聚會。",
        "單身者可能在意外場合遇到志同道合的人；有伴侶者適合深入溝通。",
        "感情穩定，適合與伴侶共同規劃未來的旅行藍圖。",
        "今天適合深入溝通，把藏在心裡的話溫柔地說出來。",
        "星象顯示今日不宜爭吵，凡事退一步海闊天空。",
        "一位很久沒見的朋友可能會帶來關於情感的新消息。"
    ],
    health: [
        "能量飽滿，適合進行較高強度的訓練或戶外運動。",
        "注意睡眠品質，晚間適合進行冥想或溫和的拉伸運動。",
        "注意眼睛疲勞，每用電腦一小時請起身看看遠方。",
        "腸胃系統較為敏感，建議今日飲食以清淡為主。",
        "晚間適合冥想，星空的力量能幫助你找回內心的平靜。",
        "適度補充水分，你的身體正在呼喚純淨的能量。"
    ],
    luckColors: ["星雲紫", "月光銀", "玫瑰金", "深海藍", "琥珀橘", "極光綠"],
    luckItems: ["銀製吊飾", "水晶原石", "手寫筆記本", "薰衣草香氛", "古銅鑰匙", "星象儀"]
};

function updateDailyFortune() {
    // 1. 取得格林威治 UTC 時間
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const date = now.getUTCDate();

    // 2. 建立日期種子（這會讓同一天內的結果固定）
    const seed = year * 10000 + (month + 1) * 100 + date;

    // 3. 偽隨機函數
    const seededRandom = function(max, offset) {
        // 使用 Math.sin 並加入 offset 讓每個細項結果不同
        const x = Math.sin(seed + offset) * 10000;
        return Math.floor((x - Math.floor(x)) * max);
    };

    // 4. 根據種子抓取結果
    const travel = fortuneData.travel[seededRandom(fortuneData.travel.length, 1)];
    const love = fortuneData.love[seededRandom(fortuneData.love.length, 2)];
    const health = fortuneData.health[seededRandom(fortuneData.health.length, 3)];
    const color = fortuneData.luckColors[seededRandom(fortuneData.luckColors.length, 4)];
    const item = fortuneData.luckItems[seededRandom(fortuneData.luckItems.length, 5)];

    // 5. 填入網頁
    document.getElementById('travel-fortune').innerText = travel;
    document.getElementById('love-fortune').innerText = love;
    document.getElementById('health-fortune').innerText = health;
    document.getElementById('lucky-fortune').innerHTML = `幸運色：${color}<br>幸運物：${item}`;

    // 6. 更新標題日期 (UTC)
    const dateString = `${year}.${String(month + 1).padStart(2, '0')}.${String(date).padStart(2, '0')}`;
    const fortuneTitle = document.querySelector('.fortune-title');
    if (fortuneTitle) {
        fortuneTitle.innerText = `每日運勢 (UTC基準) - ${dateString}`;
    }
}

// 執行
window.onload = updateDailyFortune;