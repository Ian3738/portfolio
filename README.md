# 陳奕安 Yi-An Chen｜個人網站

國立清華大學教育與學習科技學系博士生、該系兼任講師，心築師塾工作室。

線上版：<https://ian3738.github.io/portfolio/>

## 內容

| 頁面 | 檔案 | 說明 |
|---|---|---|
| 總覽 | `index.html` | 抬頭、研究焦點、概況、站內導引 |
| 關於 | `about.html` | 自述、學經歷、獲獎、心築師塾工作室 |
| 研究 | `research.html` | 研究主題、三項實證發現、研究計畫 |
| 著作 | `publications.html` | 期刊論文七篇、國際研討會十篇 |
| 系統 | `systems.html` | 五套自建系統總覽 |
| ↳ KF 平台 | `system-kf.html` | 十二原則指標、社群網絡與分布圖 |
| 教材 | `works.html` | 類別分布與分類入口 |
| ↳ 遊戲敘事 | `works-games.html` | 素養密室逃脫、敘事遊戲、互動展覽 |
| ↳ 數理教材 | `works-stem.html` | 數學與理科互動教材 |
| ↳ 工具網站 | `works-tools.html` | 教學工具、研究與社群網站 |
| 講堂 | `lectures.html` | 十場教學設計直播 |

## 技術

靜態網站，沒有建置流程，沒有相依套件。六頁共用 `assets/` 底下的樣式、腳本與資料。

- 字型走系統堆疊，不載入外部字型
- 單一淺色主題，沒有深色模式與切換鈕
- 學術取向版面：襯線內文、教職員頁式抬頭、著作採懸掛縮排的引用格式
- 底色 `#F7F8FA` 微冷灰白，面板 `#FFFFFF`，墨字 `#1B1E24`，重點色牛津藍 `#0F2D52`
- 內容拆成 11 個短分頁，單頁 5–12 KB
- 圖表為手寫 SVG，含 tooltip 與表格檢視；單一組資料用灰階，序階資料用單一藍的色階
- 講堂頁的影片採 facade：先只載縮圖，點擊後才建立 `youtube-nocookie` iframe
- 總覽頁的 build-on 網絡以力導向布局計算後靜態繪出，滑過節點可只看該成員的連結
- 圖表資料放在 `assets/data.js`，取自 Knowledge Forum 的實際匯出，社群成員一律匿名為 P01–P21

## 形象照

總覽頁的抬頭讀取 `assets/portrait.jpg`（656×900，3:4 直式）。裁切位置由 CSS 的 `object-position` 控制。

## 本機預覽

```bash
python3 -m http.server 8000
```

然後開 <http://localhost:8000>。

## 授權

網站內容著作權為陳奕安所有。程式碼部分可自由參考。
