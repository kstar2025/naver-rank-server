import express from "express";
import cors from "cors";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ 헬스체크용
app.get("/", (req, res) => {
  res.send("✅ Naver Rank Server is alive!");
});

// ✅ 실제 키워드 순위 API
app.post("/check-rank", async (req, res) => {
  const { keyword, targetName } = req.body;
  console.log(`🔍 키워드 요청: ${keyword}`);

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    const searchUrl = `https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=${encodeURIComponent(keyword)}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded" });

    // 블로거 이름 수집
    const bloggers = await page.$$eval(".user_info a.name", els =>
      els.map(el => el.textContent.trim())
    );

    // 순위 계산
    const ranks = bloggers
      .map((name, i) => (name.includes(targetName) ? i + 1 : null))
      .filter(v => v && v <= 10);

    await browser.close();

    res.json({ ranks });
  } catch (error) {
    console.error("❌ 에러 발생:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 10000, () => {
  console.log(`✅ Server running on port ${process.env.PORT || 10000}`);
});

