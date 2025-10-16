import express from "express";
import puppeteer from "puppeteer";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// ✅ 블로그 순위 확인 엔드포인트
app.post("/check-rank", async (req, res) => {
  const { keyword, targetName } = req.body;
  console.log(`🔍 검색 중: ${keyword}`);

  const searchUrl = `https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=${encodeURIComponent(keyword)}`;

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();
    await page.goto(searchUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    // 🔍 블로거 이름 가져오기
    const bloggers = await page.$$eval(".user_info, .blogger, .name", (els) =>
      els
        .map((el) => {
          const nameEl = el.querySelector("a.name, span.name, .title_area span");
          return nameEl ? nameEl.textContent.trim() : null;
        })
        .filter(Boolean)
    );

    const ranks = [];
    for (let i = 0; i < Math.min(bloggers.length, 10); i++) {
      if (bloggers[i].includes(targetName)) ranks.push(i + 1);
    }

    await browser.close();
    res.json({ keyword, ranks });
  } catch (error) {
    console.error("❌ Puppeteer 오류:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 서버 상태 확인용
app.get("/", (req, res) => {
  res.send("✅ Naver Rank Server is Running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
