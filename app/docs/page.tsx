import { redirect } from "next/navigation";

export default function DocsOverviewPage() {
  // Redirect directly to faculty guide since we're removing overview
  redirect("/docs/faculty-guide");
}