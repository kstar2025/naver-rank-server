import express from "express";
import cors from "cors";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ 서버 상태 확인용 (Render 헬스체크)
app.get("/", (req, res) => {
  res.send("✅ Naver Rank Server is alive!");
});

// ✅ 메인 API (키워드 순위 확인)
app.post("/check-rank", async (req, res) => {
  const { keyword, targetName } = req.body;

  try {
    console.log(`🔍 요청 수신: ${keyword}`);

    // Puppeteer 실행
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
      timeout: 30000, // 브라우저 실행 제한 30초
    });

    const page = await browser.newPage();
    const searchUrl = `https://search.naver.com/search.naver?ssc=tab.blog.all&query=${encodeURIComponent(keyword)}`;

    // ✅ 페이지 접속 (최대 20초 대기)
    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });

    // ✅ 블로거 이름 추출
    const bloggers = await page.$$eval(".user_info a.name", (els) =>
      els.map((el) => el.textContent.trim())
    );

    // ✅ "케이"가 들어간 블로거 순위 계산
    const ranks = bloggers
      .map((name, i) => (name.includes(targetName) ? i + 1 : null))
      .filter((v) => v && v <= 10);

    await browser.close();

    console.log(`✅ ${keyword} → ${ranks.length ? ranks.join(",") : "없음"}`);
    res.json({ ranks });
  } catch (error) {
    console.error("❌ 오류 발생:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Render 포트 설정
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
