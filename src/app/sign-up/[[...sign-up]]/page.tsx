import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0D1B3E 0%, #0A0F1E 100%)" }}>
      <SignUp />
    </div>
  );
}
