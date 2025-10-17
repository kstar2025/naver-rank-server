import express from "express";
import cors from "cors";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ 헬스체크 (Render가 서버 정상 확인용)
app.get("/", (req, res) => {
  res.send("✅ Naver Rank Server is alive!");
});

// ✅ 실제 API 엔드포인트
app.post("/check-rank", async (req, res) => {
  const { keyword, targetName } = req.body;
  console.log(`🔍 키워드 수신: ${keyword}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    const searchUrl = `https://search.naver.com/search.naver?ssc=tab.blog.all&query=${encodeURIComponent(keyword)}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 20000 });

    const bloggers = await page.$$eval(".user_info a.name", els =>
      els.map(el => el.textContent.trim())
    );

    const ranks = bloggers
      .map((name, i) => (name.includes(targetName) ? i + 1 : null))
      .filter(v => v && v <= 10);

    console.log(`✅ ${keyword} 순위: ${ranks}`);
    res.json({ keyword, ranks: ranks.length ? ranks : ["없음"] });
  } catch (error) {
    console.error(`❌ ${keyword} 오류:`, error.message);
    res.status(200).json({ keyword, ranks: ["없음"] }); // ← 실패해도 JSON은 무조건 반환하게 수정
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
});

app.listen(3000, () => console.log("✅ Server running on port 3000"));
