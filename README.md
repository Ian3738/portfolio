# 陳奕安 Yi-An Chen｜個人網站

國立清華大學教育與學習科技學系博士生、該系兼任講師，心築師塾工作室。

線上版：<https://ian3738.github.io/portfolio/>

## 內容

| 頁面 | 檔案 | 說明 |
|---|---|---|
| 首頁 | `index.html` | 簡介、三個入口、代表作 |
| 關於 | `about.html` | 自介、學經歷、獲獎、心築師塾工作室 |
| 系統 | `systems.html` | 五套自建系統，含知識翻新十二原則的操作化指標 |
| 教材 | `works.html` | 二十五件上線作品與心築研發中心 |
| 講堂 | `lectures.html` | 十場教學設計直播 |
| 研究 | `research.html` | 研究主題、期刊論文、國際研討會、研究計畫 |

## 技術

靜態網站，沒有建置流程，沒有相依套件。六頁共用 `assets/style.css` 與 `assets/site.js`。

- 字型走系統堆疊，不載入外部字型
- 深淺色雙主題，讀 `prefers-color-scheme`，切換後記在 `localStorage`
- 講堂頁的影片採 facade：先只載縮圖，點擊後才建立 `youtube-nocookie` iframe
- 開場的知識網絡以 canvas 繪製，遵守 `prefers-reduced-motion`

## 本機預覽

```bash
python3 -m http.server 8000
```

然後開 <http://localhost:8000>。

## 授權

網站內容著作權為陳奕安所有。程式碼部分可自由參考。
