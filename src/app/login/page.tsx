import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSessionUser();
  if (session) {
    redirect(session.role === "ADMIN" ? "/admin" : "/guide");
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16 flex flex-col items-center">
      <h1 className="text-xl font-bold mb-6">スタッフログイン</h1>
      <LoginForm />
    </div>
  );
}
