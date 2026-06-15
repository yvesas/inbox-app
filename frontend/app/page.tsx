import { redirect } from "next/navigation";

/** A raiz leva direto ao inbox — a interface principal do app. */
export default function Home() {
  redirect("/inbox");
}
