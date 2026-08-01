# 陳奕安 Yi-An Chen｜個人網站

國立清華大學教育與學習科技學系博士生、該系兼任講師，心築師塾工作室。

線上版：<https://ian3738.github.io/portfolio/>

## 內容

| 頁面 | 檔案 | 說明 |
|---|---|---|
| 首頁 | `index.html` | 簡介、三個入口、代表作 |
| 關於 | `about.html` | 自介、學經歷、獲獎、心築師塾工作室 |
| 系統 | `systems.html` | 五套自建系統，含知識翻新十二原則的操作化指標與社群實測圖表 |
| 教材 | `works.html` | 二十五件上線作品與心築研發中心 |
| 講堂 | `lectures.html` | 十場教學設計直播 |
| 研究 | `research.html` | 研究主題、期刊論文、國際研討會、研究計畫 |

## 技術

靜態網站，沒有建置流程，沒有相依套件。六頁共用 `assets/` 底下的樣式、腳本與資料。

- 字型走系統堆疊，不載入外部字型
- 單一淺色主題，沒有深色模式與切換鈕
- 設計語彙參考日本美術館官方網站：大量余白、髮絲線分隔、小字寬字距、中英並置、無陰影無圓角
- 色彩以 PANTONE 11-4201 Cloud Dancer（2026 年度代表色，`#F0EEE9`）為底，
  搭配官方 Comfort Zone 色盤：Mountain Trail 17-0807、Rose Brown 18-1512、Amberlight 14-1217
- 圖表為手寫 SVG，含 tooltip 與表格檢視；資料色另行驗證，六項檢查全數通過
- 講堂頁的影片採 facade：先只載縮圖，點擊後才建立 `youtube-nocookie` iframe
- 總覽頁的 build-on 網絡以力導向布局計算後靜態繪出，滑過節點可只看該成員的連結
- 圖表資料放在 `assets/data.js`，取自 Knowledge Forum 的實際匯出，社群成員一律匿名為 P01–P21

## 形象照

首頁與關於頁會讀取 `assets/portrait.jpg`（建議 3:4 直式）。檔案不存在時，該區塊會自動移除，版面不會破。

## 本機預覽

```bash
python3 -m http.server 8000
```

然後開 <http://localhost:8000>。

## 授權

網站內容著作權為陳奕安所有。程式碼部分可自由參考。
