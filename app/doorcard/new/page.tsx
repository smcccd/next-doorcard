import { requireAuthUser } from "@/lib/require-auth-user";
import NewDoorcardForm from "./NewDoorcardForm";

export default async function NewDoorcardPage() {
  await requireAuthUser();

  return (
    <div className="max-w-xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-semibold">New Doorcard</h1>
      <p className="text-sm text-gray-500">
        Start by selecting the campus, term, and year. The doorcard is only
        created after this step and won&apos;t be published until you click the
        &quot;Publish&quot; button.
      </p>
      <NewDoorcardForm />
    </div>
  );
}
