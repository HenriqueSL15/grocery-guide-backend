const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const { error } = require("console");

const app = express();
app.use(
  cors({
    origin: "https://silly-puppy-ee877a.netlify.app",
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const port = 5000;

let info = [];
const DATA_FILE = "scraped_data.json";

const links = [
  {
    comper: {
      alimentacao_saudavel: "https://www.comper.com.br/alimentacao-saudavel",
      bebidas: "https://www.comper.com.br/bebidas",
      casa_e_lazer: "https://www.comper.com.br/casa-e-lazer",
      carnes: "https://www.comper.com.br/carnes-aves-e-peixes",
      congelados: "https://www.comper.com.br/congelados",
      frios: "https://www.comper.com.br/frios-e-laticinios",
      higiene: "https://www.comper.com.br/higiene-e-beleza",
      hortifruti: "https://www.comper.com.br/hortifruti",
      infantil: "https://www.comper.com.br/infantil",
      limpeza: "https://www.comper.com.br/limpeza",
      matinais: "https://www.comper.com.br/matinais",
      mercearia: "https://www.comper.com.br/mercearia",
      padaria: "https://www.comper.com.br/padaria",
      pet_shop: "https://www.comper.com.br/pet_shop",
      doces: "",
      perfumaria: "",
      outras_categorias: "",
    },
    olho_d_agua: {
      alimentacao_saudavel: "",
      bebidas: {
        alcoolicas: {
          cerveja:
            "https://superolhodagua.instabuy.com.br/sub/Bebidas-Alcoolicas/5d12308d26ce8991c70e4c81",
        },
        nao_alcoolicas: {
          cha: "https://superolhodagua.instabuy.com.br/sub/Bebidas-Nao-Alcoolicas/5d1230aaaba19edbf30e41d6",
          energetico:
            "https://superolhodagua.instabuy.com.br/sub/Bebidas-Nao-Alcoolicas/5d1230b226ce8991c70e4ca5",
          nectar:
            "https://superolhodagua.instabuy.com.br/sub/Bebidas-Nao-Alcoolicas/5d1230b926ce8991c70e4cb2",
          refresco_em_po:
            "https://superolhodagua.instabuy.com.br/sub/Bebidas-Nao-Alcoolicas/5d1230c0748e182f890e3c58",
          refrigerante:
            "https://superolhodagua.instabuy.com.br/sub/Bebidas-Nao-Alcoolicas/5d1230c626ce8991c70e4cc3",
          sucos:
            "https://superolhodagua.instabuy.com.br/sub/Bebidas-Nao-Alcoolicas/5d1230cb26ce8991c70e4cd0",
          agua: "https://superolhodagua.instabuy.com.br/sub/Bebidas-Nao-Alcoolicas/5d1230d0aba19edbf30e41e7",
        },
      },
      casa_e_lazer: {
        cozinha:
          "https://superolhodagua.instabuy.com.br/sub/Artigos-para-o-Lar/5d122f7d26ce8991c70e4c58",
        inseticidas:
          "https://superolhodagua.instabuy.com.br/sub/Artigos-para-o-Lar/5d122f83aba19edbf30e41ca",
        lar: "https://superolhodagua.instabuy.com.br/sub/Artigos-para-o-Lar/5d122f88aba19edbf30e41cb",
        talheres_e_loucas:
          "https://superolhodagua.instabuy.com.br/sub/Artigos-para-o-Lar/5d122f8f26ce8991c70e4c70",
        lampadas_e_velas:
          "https://superolhodagua.instabuy.com.br/sub/Artigos-para-o-Lar/5d122f9626ce8991c70e4c71",
        toalhas:
          "https://superolhodagua.instabuy.com.br/sub/Artigos-para-o-Lar/5d122f9b748e182f890e3c4b",
      },
      carnes: {
        aves: "https://superolhodagua.instabuy.com.br/sub/Acougue-Aves-Peixaria/5d12301126ce8991c70e4c78",
        aves_naturais:
          "https://superolhodagua.instabuy.com.br/sub/Acougue-Aves-Peixaria/5d123048748e182f890e3c4d",
        bovinos:
          "https://superolhodagua.instabuy.com.br/sub/Acougue-Aves-Peixaria/5d12304d26ce8991c70e4c7a",
        linguicaria:
          "https://superolhodagua.instabuy.com.br/sub/Acougue-Aves-Peixaria/5d12306626ce8991c70e4c7e",
        peixaria:
          "https://superolhodagua.instabuy.com.br/sub/Acougue-Aves-Peixaria/5d12307926ce8991c70e4c7f",
        salsicharia:
          "https://superolhodagua.instabuy.com.br/sub/Acougue-Aves-Peixaria/5d12305926ce8991c70e4c7c",
        suinos:
          "https://superolhodagua.instabuy.com.br/sub/Acougue-Aves-Peixaria/5d12307e26ce8991c70e4c80",
      },
      congelados: {
        lanches:
          "https://superolhodagua.instabuy.com.br/sub/Congelados/5d12317f26ce8991c70e4d8d",
        sorvetes:
          "https://superolhodagua.instabuy.com.br/sub/Congelados/5d12318e26ce8991c70e4d8e",
      },
      frios: {
        derivados_de_queijo:
          "https://superolhodagua.instabuy.com.br/sub/Frios-e-Laticinios/5d1231caaba19edbf30e4222",
        iogurtes:
          "https://superolhodagua.instabuy.com.br/sub/Frios-e-Laticinios/5d1231de26ce8991c70e4d93",
        manteigas:
          "https://superolhodagua.instabuy.com.br/sub/Frios-e-Laticinios/5d1231e826ce8991c70e4d94",
        queijos:
          "https://superolhodagua.instabuy.com.br/sub/Frios-e-Laticinios/5d1231ecaba19edbf30e4223",
      },
      higiene: "",
      hortifruti: {
        frutas:
          "https://superolhodagua.instabuy.com.br/sub/Frutas-Verduras-Legumes/5d123204a69308e14f0e3dfe",
        hortalicas_e_folhas:
          "https://superolhodagua.instabuy.com.br/sub/Frutas-Verduras-Legumes/5d12320926ce8991c70e4d97",
        legumes:
          "https://superolhodagua.instabuy.com.br/sub/Frutas-Verduras-Legumes/5d12320e26ce8991c70e4d98",
        verduras:
          "https://superolhodagua.instabuy.com.br/sub/Frutas-Verduras-Legumes/5d12321326ce8991c70e4d99",
      },
      infantil: "",
      limpeza: {
        alvejante:
          "https://superolhodagua.instabuy.com.br/sub/Limpeza/5d12322526ce8991c70e4d9b",
        amaciante:
          "https://superolhodagua.instabuy.com.br/sub/Limpeza/5d12322aaba19edbf30e4224",
        cera: "https://superolhodagua.instabuy.com.br/sub/Limpeza/5d123231a69308e14f0e3dff",
        derivados:
          "https://superolhodagua.instabuy.com.br/sub/Limpeza/5d13a811ef86055367c61fd0",
        desinfetante:
          "https://superolhodagua.instabuy.com.br/sub/Limpeza/5d123237aba19edbf30e4225",
        desodorizador:
          "https://superolhodagua.instabuy.com.br/sub/Limpeza/5d123240a69308e14f0e3e00",
        detergente:
          "https://superolhodagua.instabuy.com.br/sub/Limpeza/5d12324d748e182f890e3c71",
        esponjas:
          "https://superolhodagua.instabuy.com.br/sub/Limpeza/5d12326826ce8991c70e4da0",
        limpador_multiuso:
          "https://superolhodagua.instabuy.com.br/sub/Limpeza/5d13a80a6d3a1503efc605a1",
        sabao_em_barra:
          "https://superolhodagua.instabuy.com.br/sub/Limpeza/5d5dace2c91cfb8331860ab2",
        sabao_em_pasta:
          "https://superolhodagua.instabuy.com.br/sub/Limpeza/5d13a817ef86055367c61fd1",
        sabao_em_po:
          "https://superolhodagua.instabuy.com.br/sub/Limpeza/5d12325daba19edbf30e4227",
        sacos_para_lixo:
          "https://superolhodagua.instabuy.com.br/sub/Limpeza/5d5dab1ac91cfb8331860a4e",
      },
      matinais: "",
      mercearia: {
        arroz:
          "https://superolhodagua.instabuy.com.br/sub/Alimentos-Basicos/5d122f3b26ce8991c70e4c51",
        enlatados:
          "https://superolhodagua.instabuy.com.br/sub/Alimentos-Basicos/5d122f48aba19edbf30e41c9",
        farinhas:
          "https://superolhodagua.instabuy.com.br/sub/Alimentos-Basicos/5d122f4d26ce8991c70e4c52",
        feijao:
          "https://superolhodagua.instabuy.com.br/sub/Alimentos-Basicos/5d122f53748e182f890e3c49",
        granel:
          "https://superolhodagua.instabuy.com.br/sub/Alimentos-Basicos/5d122f5926ce8991c70e4c55",
        massas:
          "https://superolhodagua.instabuy.com.br/sub/Alimentos-Basicos/5d122f6826ce8991c70e4c56",
        achocolatado:
          "https://superolhodagua.instabuy.com.br/sub/Mercearia/5d12327326ce8991c70e4da2",
        azeites_oleos:
          "https://superolhodagua.instabuy.com.br/sub/Mercearia/5d12327a26ce8991c70e4da3",
        acucar:
          "https://superolhodagua.instabuy.com.br/sub/Mercearia/5d12327fa69308e14f0e3e03",
        cafes:
          "https://superolhodagua.instabuy.com.br/sub/Mercearia/5d12328726ce8991c70e4da6",
        cereais:
          "https://superolhodagua.instabuy.com.br/sub/Mercearia/5d12328daba19edbf30e4228",
        leite:
          "https://superolhodagua.instabuy.com.br/sub/Mercearia/5d12329526ce8991c70e4da7",
        derivados_tomate:
          "https://superolhodagua.instabuy.com.br/sub/Condimentos-e-Molhos/5d12312ba69308e14f0e3df7",
        fermentos_essencias:
          "https://superolhodagua.instabuy.com.br/sub/Condimentos-e-Molhos/5d123130a69308e14f0e3dfa",
        maionese:
          "https://superolhodagua.instabuy.com.br/sub/Condimentos-e-Molhos/5d12313826ce8991c70e4d87",
        molhos:
          "https://superolhodagua.instabuy.com.br/sub/Condimentos-e-Molhos/5d12313d26ce8991c70e4d88",
        temperos_naturais:
          "https://superolhodagua.instabuy.com.br/sub/Condimentos-e-Molhos/5d12316426ce8991c70e4d8a",
        temperos_prontos:
          "https://superolhodagua.instabuy.com.br/sub/Condimentos-e-Molhos/5d12314aaba19edbf30e421f",
        biscoitos:
          "https://superolhodagua.instabuy.com.br/sub/Biscoitos-e-Aperitivos/5d1230e326ce8991c70e4d00",
        salgadinhos:
          "https://superolhodagua.instabuy.com.br/sub/Biscoitos-e-Aperitivos/5d1230e826ce8991c70e4d12",
      },
      padaria: {
        paes_industrializados:
          "https://superolhodagua.instabuy.com.br/sub/Padaria-e-Lanchonete/5d1232e926ce8991c70e4dac",
      },
      pet_shop: "",
      doces: {
        bolos:
          "https://superolhodagua.instabuy.com.br/sub/Doces/5d1231b3748e182f890e3c6c",
        bombonieri:
          "https://superolhodagua.instabuy.com.br/sub/Doces/5d12319b26ce8991c70e4d90",
        creme_de_leite:
          "https://superolhodagua.instabuy.com.br/sub/Doces/5d1231a1748e182f890e3c6a",
        doces_e_compotas:
          "https://superolhodagua.instabuy.com.br/sub/Doces/5d1231a9aba19edbf30e4221",
        gelatinas_e_sobremesas_em_po:
          "https://superolhodagua.instabuy.com.br/sub/Doces/5d1231af748e182f890e3c6b",
        leite_de_coco_e_coco_rolado:
          "https://superolhodagua.instabuy.com.br/sub/Doces/5d1231b9a69308e14f0e3dfd",
      },
      perfumaria: {
        absorventes:
          "https://superolhodagua.instabuy.com.br/sub/Perfumaria/5d123332a69308e14f0e3e06",
        antisseptico:
          "https://superolhodagua.instabuy.com.br/sub/Perfumaria/5d12333826ce8991c70e4daf",
        barba:
          "https://superolhodagua.instabuy.com.br/sub/Perfumaria/5d12333d748e182f890e3c74",
        desodorantes:
          "https://superolhodagua.instabuy.com.br/sub/Perfumaria/5d123343aba19edbf30e422b",
        farmacia:
          "https://superolhodagua.instabuy.com.br/sub/Perfumaria/5d123348a69308e14f0e3e07",
        fraldas:
          "https://superolhodagua.instabuy.com.br/sub/Perfumaria/5d12334d26ce8991c70e4db0",
        hidratantes_produtos_para_pele:
          "https://superolhodagua.instabuy.com.br/sub/Perfumaria/5d12335626ce8991c70e4db1",
        higiene_bucal:
          "https://superolhodagua.instabuy.com.br/sub/Perfumaria/5d12335e26ce8991c70e4db2",
        papel_higienico:
          "https://superolhodagua.instabuy.com.br/sub/Perfumaria/5d12336d26ce8991c70e4db4",
        produtos_para_cabelo_e_tintas:
          "https://superolhodagua.instabuy.com.br/sub/Perfumaria/5d123373748e182f890e3c75",
        sabonete:
          "https://superolhodagua.instabuy.com.br/sub/Perfumaria/5d12337926ce8991c70e4db6",
        shampoo_e_condicionador:
          "https://superolhodagua.instabuy.com.br/sub/Perfumaria/5d12338226ce8991c70e4db7",
      },
      outras_categorias: {
        artigos_churrasco:
          "https://superolhodagua.instabuy.com.br/sub/Outras-Categorias/5d1232a426ce8991c70e4da8",
        diveros:
          "https://superolhodagua.instabuy.com.br/sub/Outras-Categorias/5d1232a926ce8991c70e4da9",
        papelaria:
          "https://superolhodagua.instabuy.com.br/sub/Outras-Categorias/5d1232b5a69308e14f0e3e04",
        produtos_descartaveis:
          "https://superolhodagua.instabuy.com.br/sub/Outras-Categorias/5d1232bcaba19edbf30e4229",
        racoes_e_produtos_de_animais:
          "https://superolhodagua.instabuy.com.br/sub/Outras-Categorias/5d1232cbaba19edbf30e422a",
      },
    },
  },
];

// Realizar a rolagem da página para baixo e extrair os dados dos produtos
async function scrapeAndScrollComper(page) {
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

async function scrapeAndScrollOlhoDAgua(page) {
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
    const productElements = document.querySelectorAll(
      "div.css-0 div.ib-flex.is-direction-column.is-align-center.is-justify-space-between.is-gap-2.is-wrap-nowrap a"
    );

    if (!productElements.length) {
      console.warn("Nenhum elemento com a classe .shelf-item foi encontrado.");
    }

    productElements.forEach((product) => {
      // Extraindo o título
      const titleElement = product.querySelector(
        "div:nth-of-type(2) p:nth-of-type(2)"
      );

      const title = titleElement
        ? titleElement.textContent.trim()
        : "Título indisponível";

      // Extraindo o preço
      const priceElement = product.querySelector("div:first-of-type div p");

      const price = priceElement
        ? priceElement.textContent.trim().replace("/kg", "")
        : "Preço indisponível";

      // Extraindo a URL da imagem
      const imageElement = product.querySelector("img");
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
  console.log(url);
  const items = [];
  const chromium = require("@sparticuz/chromium-min"); // Adicione este pacote
  const browser = await puppeteer.launch({
    args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(), // Caminho correto para Chromium
    headless: "new",
  });
  const page = await browser.newPage();
  if (url.length > 14 && typeof url === "string") {
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
          const products = await scrapeAndScrollComper(page);

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
  } else {
    for (let i = 0; i < url.length; i++) {
      if (
        url[i].link
          .toLowerCase()
          .startsWith("https://superolhodagua.instabuy.com.br/".toLowerCase())
      ) {
        try {
          // Iniciar a navegação
          await page.goto(url[i].link, { waitUntil: "domcontentloaded" });

          // Aguardar e fechar o primeiro pop-up
          await page.waitForSelector("div.css-1qe97w9", { visible: true });

          let stop = false;

          for (let i = 0; i < 2 && !stop; i++) {
            // Realizar a rolagem contínua e extrair produtos
            const products = await scrapeAndScrollOlhoDAgua(page);

            items.push(...products);

            // Seletor que cobre tanto 'a' quanto 'button' com as classes especificadas
            const selector =
              'a[aria-label="back to page 2"], button[aria-label="back go page 2"';

            // Verifica se existe algum elemento correspondente
            const elementExists = await page
              .$(selector)
              .then((element) => !!element);

            if (elementExists) {
              // Verifica se o elemento está desabilitado (considera 'disabled' e 'aria-disabled')
              const isDisabled = await page.$eval(selector, (element) => {
                return (
                  element.hasAttribute("disabled") ||
                  element.getAttribute("aria-disabled") === "true"
                );
              });

              console.log("Está desabilitado?", isDisabled);

              if (!isDisabled) {
                // Clica no elemento usando Puppeteer (cosm tratamento de erro)
                await page.click(selector).catch(() => {});
                console.log("Clique realizado");
                stop = false;
              } else {
                console.log("Elemento desabilitado - não clicou");
                stop = true;
              }
            } else {
              console.log("Elemento não encontrado");
              stop = true;
            }
          }
        } catch (error) {
          console.log(error);
          await browser.close();
        }
      } else {
        items.push("");
      }
    }
    await browser.close(); // Fecha o navegador
    return items; // Retorna a resposta
  }
}

//Função para obter o último valor de uma "escada" de objetos
function getLastValues(obj) {
  const result = [];
  if (
    typeof obj == "string" &&
    obj.toLowerCase().startsWith("https://www.comper.com.br/")
  ) {
    return obj;
  }

  function navigate(current) {
    for (const key in current) {
      //Verifica se o tipo da chave atual dentro do objeto original é igual a um objeto e também se o valor é nulo
      if (typeof current[key] === "object" && current[key] !== null) {
        navigate(current[key]); // Continua navegando se for um objeto
      } else {
        result.push({ name: key, link: current[key] }); // Adiciona o último valor encontrado
      }
    }
  }

  navigate(obj);
  return result;
}

// Função para realizar scraping diário
async function performDailyScraping() {
  let scrapingResults = {
    comper: {},
    olho_d_agua: {},
  };
  // const markets = ["olho_d_agua", "comper"];
  const markets = ["comper", "olho_d_agua"];

  const categories = [
    "alimentacao_saudavel",
    "bebidas",
    "casa_e_lazer",
    "carnes",
    "congelados",
    "frios",
    "higiene",
    "hortifruti",
    "infantil",
    "limpeza",
    "matinais",
    "mercearia",
    "padaria",
    "pet_shop",
    "doces",
    "perfumaria",
    "outras_categorias",
  ];
  for (let j = 0; j < markets.length; j++) {
    const activeMarket = markets[j];

    for (let i = 0; i < categories.length; i++) {
      const activeCategory = categories[i];

      const allValues = getLastValues(links[0][activeMarket][activeCategory]);
      let url = [];
      if (typeof allValues == "object") {
        url = allValues;
      } else {
        url = links[0][activeMarket][activeCategory];
      }

      if (url) {
        console.log(`Iniciando scraping para: ${activeCategory} - ${url}`);
        if (activeMarket == "olho_d_agua") {
          scrapingResults.olho_d_agua[activeCategory] = await scrapeSupermarket(
            url
          );
        } else if (activeMarket == "comper") {
          scrapingResults.comper[activeCategory] = await scrapeSupermarket(url);
        }
      } else {
        console.log("Não existe");
        scrapingResults[activeCategory] = [];
      }
    }
  }

  // Salvar resultados no arquivo JSON
  fs.writeFileSync(DATA_FILE, JSON.stringify(scrapingResults, null, 2));
  console.log("Scraping diário concluído e dados salvos.");
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

app.get("/", (req, res) => {
  res.send(
    "Backend do Grocery Guide está online! Use /data para acessar os produtos."
  );
});

// Configurar cron job para executar o scraping diariamente às 00:00
// cron.schedule("0 0 * * *", () => {
//   const caminhoArquivo = path.join(__dirname, DATA_FILE);
//   fs.unlink(caminhoArquivo, (err) => {
//     if (err) {
//       console.log("Erro ao remover o arquivo:", err);
//       return;
//     }
//     console.log("Arquivo removido com sucesso");
//   });
//   performDailyScraping();
// });

// Rota para receber informações iniciais
app.post("/info", (req, res) => {
  info = req.body;
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
server.setTimeout(7200000);
