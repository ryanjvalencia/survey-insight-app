import PageHeader from "@/components/layout/PageHeader";
import AuthForm from "@/components/auth/AuthForm";
import { safeRedirectPath } from "@/lib/auth";
import { signup } from "../actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const safeNext = safeRedirectPath(next);

  return (
    <>
      <PageHeader
        title="Create your account"
        description="Your projects are private to your account."
      />
      <AuthForm mode="signup" action={signup} next={safeNext} />
    </>
  );
}
