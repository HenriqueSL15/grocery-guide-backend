const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");
const fs = require("fs");
const cron = require("node-cron");

const app = express();
app.use(cors());
app.use(express.json());
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const port = 5000;

let info = [];
const DATA_FILE = "scraped_data.json";

// Realizar a rolagem da página para baixo e extrair os dados dos produtos
async function scrapeAndScroll(page) {
  const items = [];
  let scrolled = 0;
  const distance = 100; // Distância a ser rolada a cada vez
  const scrollHeight = await page.evaluate(() => {
    return document.documentElement.scrollHeight;
  }); // Tamanho total da página para rolar até o final

  while (scrolled < scrollHeight) {
    await page.evaluate(() => {
      window.scrollBy(0, 100); // Rola para baixo
    });
    scrolled += distance;
    // Usar a função wait para adicionar delay
    await wait(250); // Espera 2000 milissegundos (2 segundos)
  }
  // Extrai os produtos após cada rolagem
  const products = await page.evaluate(() => {
    const extractedInfo = [];
    // Selecionar todas as divs com a classe para os produtos
    const productElements = document.querySelectorAll(".shelf-item");

    if (!productElements.length) {
      console.warn("Nenhum elemento com a classe .shelf-item foi encontrado.");
    }

    productElements.forEach((product) => {
      // Extraindo o título
      const titleElement = product.querySelector(".shelf-item__title-link");
      const title = titleElement
        ? titleElement.textContent.trim()
        : "Título indisponível";

      // Extraindo o preço
      const priceElement = product.querySelector("div.best-price strong");
      const price = priceElement
        ? priceElement.textContent.trim()
        : "Preço indisponível";

      // Extraindo a URL da imagem
      const imageElement = product.querySelector("a.shelf-item__img-link img");
      const image = imageElement ? imageElement.src : "Imagem indisponível";

      // Adiciona o item mesmo que alguns dados estejam ausentes
      extractedInfo.push({ title, price, image });
    });
    return extractedInfo;
  });

  // Adiciona os produtos extraídos ao array principal
  items.push(...products);

  return items;
}

// Função de scraping
async function scrapeSupermarket(url) {
  const items = [];
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  if (
    url.toLowerCase().startsWith("https://www.comper.com.br/".toLowerCase())
  ) {
    try {
      // Iniciar a navegação
      await page.goto(url, { waitUntil: "domcontentloaded" });

      // Aguardar e fechar o primeiro pop-up
      await page.waitForSelector("div.app-modal__close", { visible: false });
      await page.evaluate(() => {
        const element = document.querySelector("div.app-modal__close");
        if (element) {
          element.click();
        }
      });

      // Aguardar o input de CEP aparecer
      await page.waitForSelector(
        "div.modalCep-content--insertPostalCode-postalCodeContainer input",
        { visible: true }
      );
      await page.type(
        "div.modalCep-content--insertPostalCode-postalCodeContainer input",
        "72450120",
        { delay: 500 } // Ajuste o delay para 100 milissegundos entre cada tecla
      );

      // Usar a função wait para adicionar delay
      await wait(2000); // Espera 2000 milissegundos (2 segundos)

      // Aguardar o botão de ação e clicar
      await page.waitForSelector("button#cepInsertedAction", {
        visible: true,
      });
      await page.click("button#cepInsertedAction");

      // Aguardar para a navegação ou carregamento após a interação
      await page.waitForSelector(
        "div.modalCep-content--pickDeliveryType--types-delivery-content--item input",
        { visible: true }
      );
      await page.evaluate(() => {
        const element = document.querySelector(
          "div.modalCep-content--pickDeliveryType--types-delivery-content--item input"
        );
        if (element) {
          element.click();
        }
      });

      await page.waitForSelector(
        "a#dm876A > div.dp-bar-button.dp-bar-dismiss",
        {
          visible: true,
        }
      );

      await page.evaluate(() => {
        const element = document.querySelector(
          "a#dm876A > div.dp-bar-button.dp-bar-dismiss"
        );
        if (element) {
          element.click();
        }
      });

      // Aguardar e fechar o pop-up
      await page.waitForSelector("button#deliveryTypeSelected", {
        visible: true,
      });
      await page.evaluate(() => {
        const element = document.querySelector("button#deliveryTypeSelected");
        if (element) {
          element.click();
        }
      });

      console.log("Último pop-up fechado.");

      // Aguardar a navegação ou carregamento após o clique, se necessário
      await page.waitForNavigation({ waitUntil: "networkidle0" });

      let stop = false;

      for (let i = 0; i < 4 && !stop; i++) {
        // Realizar a rolagem contínua e extrair produtos
        const products = await scrapeAndScroll(page);

        items.push(...products);

        stop = await page.evaluate((currentIndex) => {
          const div = document.querySelector(".pagination"); // Seleciona a div com a classe pagination
          const links = div ? div.querySelectorAll("a") : [];

          if (currentIndex == 0) {
            if (links[5]) {
              links[5]?.click();
              return false;
            } else {
              links[3]?.click();
              return true;
            }
          } else if (currentIndex == 1) {
            links[7]?.click();
          } else if (currentIndex == 2) {
            links[8]?.click();
          } else if (currentIndex == 3) {
            links[9]?.click();
          } else {
            console.error("Não há 6 <a> elementos dentro da div .pagination");
          }

          return false;
        }, i);
      }

      // Você pode fazer o que quiser com os produtos aqui
      //console.log(products);

      await browser.close(); // Fecha o navegador
      return items; // Retorna a resposta
    } catch (error) {
      console.error("Erro ao fazer scraping:", error);
      await browser.close(); // Fecha o navegador em caso de erro
      throw error;
    }
  }
}

// Função para realizar scraping diário
async function performDailyScraping() {
  console.log(info);
  try {
    const activeCategories = Object.entries(info[2])
      .filter(([key, value]) => value)
      .map(([key]) => key);

    const scrapingResults = {};

    for (const category of activeCategories) {
      const url = info[1][category];
      if (url) {
        console.log(`Iniciando scraping para: ${category} - ${url}`);
        scrapingResults[category] = await scrapeSupermarket(url);
      } else {
        scrapingResults[category] = [];
      }
    }

    // Salvar resultados no arquivo JSON
    fs.writeFileSync(DATA_FILE, JSON.stringify(scrapingResults, null, 2));
    console.log("Scraping diário concluído e dados salvos.");
  } catch (error) {
    console.error("Erro durante o scraping diário:", error);
  }
}

// Adicionar um endpoint para iniciar o scraping manualmente
app.post("/start-scraping", async (req, res) => {
  console.log("começando scrape");
  try {
    await performDailyScraping();
    res.send("Scraping manual iniciado e concluído com sucesso.");
  } catch (error) {
    console.error("Erro ao iniciar scraping manual:", error);
    res.status(500).send("Erro ao iniciar scraping manual.");
  }
});

// Configurar cron job para executar o scraping diariamente às 00:00
cron.schedule("0 0 * * *", performDailyScraping);

// Rota para receber informações iniciais
app.post("/info", (req, res) => {
  console.log("Info antes:", info);
  info = req.body;
  console.log("Info Depois:", info);
  res.send("Informações recebidas.");
});

// Rota para acessar os dados armazenados
app.get("/data", (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf8");
      res.json(JSON.parse(data));
    } else {
      res.status(404).send("Dados ainda não disponíveis.");
    }
  } catch (error) {
    console.error("Erro ao acessar dados armazenados:", error);
    res.status(500).send("Erro ao acessar dados armazenados.");
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
