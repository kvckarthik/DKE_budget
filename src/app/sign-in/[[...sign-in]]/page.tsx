import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0D1B3E 0%, #0A0F1E 100%)" }}>
      <SignIn />
    </div>
  );
}
