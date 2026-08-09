# 陳奕安 Yi-An Chen｜個人網站

國立清華大學教育與學習科技學系博士生、該系兼任講師，心築師塾工作室。

線上版：<https://ian3738.github.io/portfolio/>

## 內容

| 頁面 | 檔案 | 說明 |
|---|---|---|
| 總覽 | `index.html` | 抬頭、研究焦點、概況、站內導引 |
| 關於 | `about.html` | 自述、學經歷、獲獎、心築師塾工作室 |
| 研究 | `research.html` | 研究主題、三項實證發現、研究計畫 |
| 著作 | `publications.html` | 期刊論文七篇、研討會發表十六篇 |
| 工具 | `systems.html` | 五套研究工具與平台總覽 |
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
- 設計語彙參考 saitokyoko.jp：全站單一襯線字、字重一律 400、沒有粗體，
  階層只靠級數、字距與留白
- 墨色 #494949 柔灰不用純黑，唯一輔助色為暖砂 #DECCB1
- 只有漢堡選單，開啟後為全幅選單；首頁是左文右像的全幅開場
- 圖表資料色為灰階序階 #494949 / #878787 / #AFAFAF，
  明度單調、階距 0.18、最淺階對白底 2.19:1
- 字型使用 Google Fonts：Cormorant Garamond 與 Noto Serif TC
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
