import express from "express";
import cors from "cors";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/check-rank", async (req, res) => {
  const { keyword, targetName } = req.body;
  console.log("🔍 요청 받은 키워드:", keyword);

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    const searchUrl = `https://search.naver.com/search.naver?ssc=tab.blog.all&query=${encodeURIComponent(keyword)}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded" });

    const bloggers = await page.$$eval(".user_info a.name", els =>
      els.map(el => el.textContent.trim())
    );

    const ranks = bloggers
      .map((name, i) => (name.includes(targetName) ? i + 1 : null))
      .filter(v => v && v <= 10);

    await browser.close();

    res.json({ keyword, ranks: ranks.length ? ranks : ["없음"] });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Naver Rank Server is running!");
});

app.listen(3000, () => console.log("✅ Server running on port 3000"));
