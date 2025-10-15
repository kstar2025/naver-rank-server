import express from "express";
import puppeteer from "puppeteer";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

app.post("/check-rank", async (req, res) => {
  const { keyword, targetName } = req.body;
  console.log(`🔍 검색 중: ${keyword}, 타겟: ${targetName}`);

  const searchUrl = `https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=${encodeURIComponent(keyword)}`;

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  try {
    await page.goto(searchUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000); // 로딩 안정화 대기

    // ✅ 네이버 최신 구조 대응 (.name 대신 .blogger)
    const bloggers = await page.$$eval(".user_info, .blogger", (elements) =>
      elements
        .map((el) => {
          const nameEl = el.querySelector("a.name, .name, .title_area span");
          return nameEl ? nameEl.textContent.trim() : null;
        })
        .filter(Boolean)
    );

    // ✅ 순위 계산
    const ranks = [];
    for (let i = 0; i < Math.min(bloggers.length, 10); i++) {
      if (bloggers[i].includes(targetName)) {
        ranks.push(i + 1);
      }
    }

    await browser.close();
    res.json({ keyword, ranks });
  } catch (error) {
    await browser.close();
    console.error("❌ 오류:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Naver Rank Server is Running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
