import express from "express";
import cors from "cors";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ 헬스체크 (Render 서버 정상 작동 테스트용)
app.get("/", (req, res) => {
  res.send("✅ Naver Rank Server is alive!");
});

// ✅ 핵심 API (키워드 순위 확인)
app.post("/check-rank", async (req, res) => {
  const { keyword, targetName } = req.body;
  console.log(`🔍 요청받은 키워드: ${keyword}`);

  try {
    // Puppeteer 실행 설정 (Render 환경 대응)
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    const searchUrl = `https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=${encodeURIComponent(keyword)}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

    // 블로그 작성자 이름 수집
    const bloggers = await page.$$eval(".user_info a.name", (els) =>
      els.map((el) => el.textContent.trim())
    );

    // 순위 계산 (10위까지만)
    const ranks = bloggers
      .map((name, i) => (name.includes(targetName) ? i + 1 : null))
      .filter((v) => v && v <= 10);

    await browser.close();
    res.json({ ranks });
  } catch (error) {
    console.error("❌ 오류 발생:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Render 포트 환경 변수 대응
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
