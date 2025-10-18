app.post("/check-rank", async (req, res) => {
  const { keyword, targetName } = req.body;
  console.log(`🔍 요청받은 키워드: ${keyword}`);

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    const searchUrl = `https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=${encodeURIComponent(keyword)}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

    const bloggers = await page.$$eval(".user_info a.name", (els) =>
      els.map((el) => el.textContent.trim())
    );

    const ranks = bloggers
      .map((name, i) => (name.includes(targetName) ? i + 1 : null))
      .filter((v) => v && v <= 10);

    await browser.close();

    // ✅ 여기서 반드시 JSON 형태로 응답 보내야 함!
    res.json({ ranks });
  } catch (error) {
    console.error("❌ 오류 발생:", error.message);
    res.status(500).json({ error: error.message });
  }
});
