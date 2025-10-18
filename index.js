import express from "express";
import cors from "cors";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ 서버 작동 확인용 (브라우저에서 이 주소 열면 OK)
app.get("/", (req, res) => {
  res.send("✅ Naver Rank Server is Running!");
});

// ✅ 실제 키워드 순위 API
app.post("/check-rank", async (req, res) => {
  const { keyword, targetName } = req.body;
  console.log(`🔍 요청받은 키워드: ${keyword}`);

  if (!keyword || !targetName) {
    return res.status(400).json({ error: "keyword와 targetName은 필수입니다." });
  }

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    const url = `https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=${encodeURIComponent(keyword)}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    const bloggers = await page.$$eval(".user_info a.name", (els) =>
      els.map((el) => el.textContent.trim())
    );

    const ranks = bloggers
      .map((name, i) => (name.includes(targetName) ? i + 1 : null))
      .filter((v) => v && v <= 10);

    await browser.close();

    console.log(`✅ ${keyword}: ${ranks.length ? ranks : "없음"}`);
    return res.json({ ranks: ranks.length ? ranks : [] }); // ✅ 무조건 JSON 반환
  } catch (err) {
    console.error("❌ 오류:", err.message);
    return res.status(500).json({ error: err.message, ranks: [] }); // ✅ 반드시 JSON 응답
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
