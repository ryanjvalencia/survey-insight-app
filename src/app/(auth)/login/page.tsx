import PageHeader from "@/components/layout/PageHeader";
import AuthForm from "@/components/auth/AuthForm";
import { safeRedirectPath } from "@/lib/auth";
import { login } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const safeNext = safeRedirectPath(next);

  return (
    <>
      <PageHeader title="Sign in" description="Welcome back. Sign in to see your projects." />
      <AuthForm mode="login" action={login} next={safeNext} />
    </>
  );
}
