import express from "express";
import cors from "cors";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ 서버 확인용 엔드포인트
app.get("/", (req, res) => {
  res.send("✅ Naver Rank Server is Running!");
});

// ✅ 핵심 기능: 네이버 블로그 순위 체크
app.post("/check-rank", async (req, res) => {
  const { keyword, targetName } = req.body;
  console.log(`🔍 요청받은 키워드: ${keyword}`);

  if (!keyword || !targetName) {
    return res.status(400).json({ error: "keyword와 targetName은 필수입니다." });
  }

  try {
    // Puppeteer 설정 (Render 환경에서 작동하도록 chromium 설정)
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

    // 블로거 이름 수집
    const bloggers = await page.$$eval(".user_info a.name", (els) =>
      els.map((el) => el.textContent.trim())
    );

    // 키워드에 해당 블로그 이름 포함된 순위 계산
    const ranks = bloggers
      .map((name, i) => (name.includes(targetName) ? i + 1 : null))
      .filter((v) => v && v <= 10);

    await browser.close();

    // ✅ 반드시 JSON 형태로 응답
    res.json({ ranks: ranks.length ? ranks : [] });
  } catch (error) {
    console.error("❌ 오류 발생:", error);
    res.status(500).json({ error: error.message || "Unknown error" });
  }
});

// ✅ Render 기본 포트 설정
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
