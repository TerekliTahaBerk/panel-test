import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderAdminPreview } from "../render";

describe("Application shell", () => {
  it("renders the role navigation with the active item", () => {
    renderAdminPreview();
    const sidebar = screen.getByRole("complementary", { name: "Kenar çubuğu" });
    const main = within(sidebar).getByRole("navigation", { name: "Ana menü" });
    expect(within(main).getByRole("link", { name: /Genel Bakış/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(main).getByRole("button", { name: /Öğrenciler/ })).toBeInTheDocument();
    expect(within(sidebar).getByRole("navigation", { name: "Yönetim" })).toBeInTheDocument();
    expect(within(sidebar).getByRole("navigation", { name: "Favoriler" })).toBeInTheDocument();
    expect(within(sidebar).getByRole("button", { name: "Hesap menüsü" })).toBeInTheDocument();
  });

  it("collapses the sidebar to an icon rail and expands it again", async () => {
    const { user } = renderAdminPreview();
    const sidebar = screen.getByRole("complementary", { name: "Kenar çubuğu" });
    const toggle = screen.getByRole("button", { name: "Kenar çubuğunu daralt" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await user.click(toggle);
    expect(screen.getByRole("button", { name: "Kenar çubuğunu genişlet" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    // Labels move to accessible names / tooltips; visible text is gone.
    expect(within(sidebar).queryByText("Ödevler")).not.toBeInTheDocument();
    expect(within(sidebar).getByRole("button", { name: "Ödevler" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Kenar çubuğunu genişlet" }));
    expect(within(sidebar).getByText("Ödevler")).toBeInTheDocument();
  });

  it("opens and closes the mobile navigation drawer", async () => {
    const { user } = renderAdminPreview();
    const trigger = screen.getByRole("button", { name: "Menüyü aç" });
    await user.click(trigger);
    const drawer = await screen.findByRole("dialog", { name: "Gezinme menüsü" });
    expect(within(drawer).getByRole("link", { name: /Genel Bakış/ })).toBeInTheDocument();
    await user.click(within(drawer).getByRole("button", { name: "Menüyü kapat" }));
    expect(screen.queryByRole("dialog", { name: "Gezinme menüsü" })).not.toBeInTheDocument();
  });

  it("opens the command palette with ⌘K and filters results", async () => {
    const { user } = renderAdminPreview();
    fireEvent.keyDown(document, { key: "k", metaKey: true });
    const palette = await screen.findByRole("dialog", { name: "Komut paleti" });
    await user.type(within(palette).getByRole("combobox"), "ödev");
    expect(within(palette).getByRole("option", { name: /Ödevler/ })).toBeInTheDocument();
    expect(within(palette).getByRole("option", { name: /Ödev Ata/ })).toBeInTheDocument();
    expect(within(palette).queryByRole("option", { name: /Analizler/ })).not.toBeInTheDocument();
  });

  it("opens the palette from the search buttons", async () => {
    const { user } = renderAdminPreview();
    await user.click(screen.getByRole("button", { name: "Ara (Command K)" }));
    expect(await screen.findByRole("dialog", { name: "Komut paleti" })).toBeInTheDocument();
  });

  it("lists notifications in a menu", async () => {
    const { user } = renderAdminPreview();
    await user.click(screen.getByRole("button", { name: "Bildirimler, 3 okunmamış" }));
    const menu = await screen.findByRole("menu");
    expect(within(menu).getByText("TYT Deneme #6 sonuçları yayımlandı")).toBeInTheDocument();
  });

  it("gives every icon-only control an accessible name", () => {
    renderAdminPreview();
    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveAccessibleName();
    }
  });
});
