const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
const port = 5000;

// Função de scraping
async function scrapeSupermarket(url) {
  console.log("Iniciando scraping...");

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Iniciar a navegação
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Aguardar e fechar o primeiro pop-up
    await page.waitForSelector("div.app-modal__close", { visible: true });
    await page.evaluate(() => {
      const element = document.querySelector("div.app-modal__close");
      if (element) {
        element.click();
      }
    });
    console.log("Primeiro pop-up fechado.");

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

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Usar a função wait para adicionar delay
    await wait(2000); // Espera 2000 milissegundos (2 segundos)

    // Aguardar o botão de ação e clicar
    await page.waitForSelector("button#cepInsertedAction", { visible: true });
    await page.click("button#cepInsertedAction");

    // // Aguardar navegação ou carregamento após a interação
    // await page.waitForNavigation({ waitUntil: "networkidle0" });

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

    await page.waitForSelector("a#dm876A > div.dp-bar-button.dp-bar-dismiss", {
      visible: true,
    });
    await page.evaluate(() => {
      const element = document.querySelector(
        "a#dm876A > div.dp-bar-button.dp-bar-dismiss"
      );
      if (element) {
        element.click();
      }
    });
    //deliveryTypeSelected
    await page.waitForSelector("button#deliveryTypeSelected", {
      visible: true,
    });
    await page.evaluate(() => {
      const element = document.querySelector("button#deliveryTypeSelected");
      if (element) {
        element.click();
      }
    });

    // Fechar o último pop-up
    await page.waitForSelector("button#onesignal-slidedown-cancel-button", {
      visible: true,
    });
    await page.evaluate(() => {
      const element = document.querySelector(
        "button#onesignal-slidedown-cancel-button"
      );
      if (element) {
        element.click();
      }
    });
    console.log("Último pop-up fechado.");

    // Aguarde a navegação ou atualização da página
    await page.waitForNavigation({ waitUntil: "networkidle0" });

    // Realizar a rolagem da página para baixo
    await page.evaluate(() => {
      return new Promise((resolve) => {
        let distance = 100; // Distância a ser rolada a cada vez
        let scrollHeight = 12000;
        let scrolled = 0;

        // Rolando até o fim da página ou até 5 vezes
        let interval = setInterval(() => {
          window.scrollBy(0, distance);
          scrolled += distance;
          if (scrolled >= scrollHeight) {
            clearInterval(interval);
            resolve(); // Resolve a promessa quando a rolagem terminar
          }
        }, 100); // Rolagem a cada 500ms
      });
    });

    // Extrair dados dos produtos
    const products = await page.evaluate(() => {
      const items = [];

      // Selecionar todas as divs com a classe para os produtos
      const productElements = document.querySelectorAll(".shelf-item");

      if (!productElements.length) {
        console.warn(
          "Nenhum elemento com a classe .shelf-item foi encontrado."
        );
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
        const imageElement = product.querySelector(
          "a.shelf-item__img-link img"
        );
        const image = imageElement ? imageElement.src : "Imagem indisponível";

        // Adiciona o item mesmo que alguns dados estejam ausentes
        items.push({ title, price, image });
      });

      return items; // Retorna os produtos encontrados
    });

    //await browser.close(); // Fecha o navegador
    return products; // Retorna os produtos para a resposta
  } catch (error) {
    console.error("Erro ao fazer scraping:", error);
    // await browser.close(); // Fecha o navegador em caso de erro
    throw error;
  }
}

// Rota para receber qual é o site
app.post("/info", async (req, res) => {
  info = req.body;
});

// Rota para o scraping
app.get("/scrape", async (req, res) => {
  try {
    const data = await scrapeSupermarket("https://www.comper.com.br/limpeza");
    console.log("Dados extraídos:", data);
    res.json(data);
  } catch (error) {
    console.error("Erro ao fazer scraping:", error);
    res.status(500).send("Erro ao fazer scraping");
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
