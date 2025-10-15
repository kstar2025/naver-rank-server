import express from "express";
import puppeteer from "puppeteer";

const app = express();
app.use(express.json());

app.post("/check-rank", async (req, res) => {
  const { keyword, targetName } = req.body;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    const searchUrl = `https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=${encodeURIComponent(keyword)}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded" });

    const bloggers = await page.$$eval(".user_info a.name", (els) =>
      els.map((el) => el.textContent.trim())
    );

    let ranks = [];
    for (let i = 0; i < Math.min(5, bloggers.length); i++) {
      if (bloggers[i].includes(targetName)) ranks.push(i + 1);
    }

    await browser.close();
    res.json({ keyword, ranks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log("✅ Server running on port 3000"));
