import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm space-y-6 p-8 bg-white rounded-xl shadow">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">KoboToolbox Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter the dashboard password to continue.</p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
