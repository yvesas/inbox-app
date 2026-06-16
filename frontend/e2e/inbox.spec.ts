import { test, expect } from "@playwright/test";

/**
 * E2E do inbox contra o backend mock local (dados semeados determinísticos em
 * server/src/seed.mjs). Exercita o fluxo real: listar → buscar → abrir → enviar
 * (optimistic) → sugerir com IA.
 */

test.describe("Inbox", () => {
  test("lista as conversas semeadas, ordenadas pela última mensagem", async ({ page }) => {
    await page.goto("/inbox");

    await expect(page.getByRole("link", { name: /Mariana Lopes/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Rafael Augusto/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Camila Nogueira/ })).toBeVisible();

    // A mais recente (Mariana, 11:42) vem antes da de Rafael (10:15).
    const names = await page.getByRole("navigation", { name: "Conversas" }).getByRole("link").all();
    const first = await names[0]?.textContent();
    expect(first).toContain("Mariana Lopes");
  });

  test("a busca filtra a lista", async ({ page }) => {
    await page.goto("/inbox");

    await page.getByRole("searchbox", { name: "Buscar conversas" }).fill("Juliana");

    await expect(page.getByRole("link", { name: /Juliana Prado/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Mariana Lopes/ })).toBeHidden();
  });

  test("abre uma conversa e mostra o histórico de mensagens", async ({ page }) => {
    await page.goto("/inbox");
    await page.getByRole("link", { name: /Mariana Lopes/ }).click();

    await expect(page).toHaveURL(/\/inbox\/c-1001$/);
    // Escopa ao chat: a prévia da lista também contém esse texto (split view).
    const messages = page.getByRole("log", { name: "Mensagens da conversa" });
    await expect(messages.getByText("Bom dia")).toBeVisible();
    await expect(messages.getByText(/Minha internet caiu de novo agora de manhã/)).toBeVisible();
  });

  test("envia uma mensagem e ela aparece no chat (optimistic)", async ({ page }) => {
    await page.goto("/inbox/c-1002");

    const texto = `Mensagem de teste E2E ${Date.now()}`;
    await page.getByRole("textbox", { name: "Escrever mensagem" }).fill(texto);
    await page.getByRole("button", { name: "Enviar", exact: true }).click();

    // A bolha aparece no chat (a prévia da lista também atualiza → escopa ao log).
    const messages = page.getByRole("log", { name: "Mensagens da conversa" });
    await expect(messages.getByText(texto)).toBeVisible();
    // O campo é limpo logo após o envio.
    await expect(page.getByRole("textbox", { name: "Escrever mensagem" })).toHaveValue("");
  });

  test("a sugestão de IA popula o composer", async ({ page }) => {
    await page.goto("/inbox/c-1001");

    await page.getByRole("button", { name: "Sugerir resposta com IA" }).click();

    // c-1001 fala em internet que "caiu" → sugestão heurística determinística.
    await expect(page.getByRole("textbox", { name: "Escrever mensagem" })).toHaveValue(
      /Sinto muito pelo transtorno/,
    );
  });

  test("mostra o estado vazio quando nenhuma conversa está aberta", async ({ page }) => {
    await page.goto("/inbox");
    await expect(page.getByText("Selecione uma conversa para começar.")).toBeVisible();
  });
});
