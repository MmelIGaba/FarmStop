import { useState } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  Store,
  Tractor,
  ArrowLeft,
  Loader2,
  CheckCircle,
  KeyRound, // Added Icon
} from "lucide-react";
import {
  signIn,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword, // <--- NEW IMPORT
  fetchAuthSession,
} from "aws-amplify/auth";

export default function AuthModal({ isOpen, onClose }) {
  // Views: 'login', 'signup', 'confirm', 'forgot-password', 'forgot-password-submit'
  const [view, setView] = useState("login"); 
  const [role, setRole] = useState("buyer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "", // Acts as "New Password" during reset
    name: "",
    farmName: "",
    code: "",
  });

  if (!isOpen) return null;

  const syncUser = async () => {
    const session = await fetchAuthSession();
    const token = session.tokens.accessToken.toString();
    const userId = session.userSub;

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/auth/sync`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: role,
          name: formData.name || "User",
          email: formData.email,
          id: userId,
        }),
      },
    );

    if (!response.ok) throw new Error("Failed to sync profile");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      if (view === "signup") {
        await signUp({
          username: formData.email,
          password: formData.password,
          options: {
            userAttributes: {
              email: formData.email,
              name: formData.name,
            },
          },
        });

        setSuccessMsg(`Code sent to ${formData.email}`);
        setView("confirm");
      
      } else if (view === "confirm") {
        const cleanCode = formData.code.trim();
        await confirmSignUp({
          username: formData.email,
          confirmationCode: cleanCode,
        });

        await signIn({
          username: formData.email,
          password: formData.password,
        });
        await syncUser();
        onClose();

      } else if (view === "login") {
        try {
          const { isSignedIn } = await signIn({
            username: formData.email,
            password: formData.password,
          });

          if (isSignedIn) {
            await syncUser();
            onClose();
          }
        } catch (loginErr) {
          if (loginErr.name === "UserNotConfirmedException") {
            try {
                await resendSignUpCode({ username: formData.email });
                setSuccessMsg("Account unverified. A new code has been sent.");
            } catch (resendErr) {
                setSuccessMsg("Account unverified. Please enter the code.");
            }
            setView("confirm");
            return;
          }
          throw loginErr;
        }

      // --- STEP 1: REQUEST RESET ---
      } else if (view === "forgot-password") {
        await resetPassword({ username: formData.email });
        setSuccessMsg("Reset code sent to email.");
        setView("forgot-password-submit"); // Move to Step 2
      
      // --- STEP 2: CONFIRM RESET ---
      } else if (view === "forgot-password-submit") {
        await confirmResetPassword({
            username: formData.email,
            confirmationCode: formData.code,
            newPassword: formData.password
        });
        setSuccessMsg("Password changed! Please log in.");
        setView("login");
      }

    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine title
  const getTitle = () => {
    if(view === "login") return "Welcome back";
    if(view === "signup") return "Create an account";
    if(view === "confirm") return "Verify Email";
    if(view === "forgot-password") return "Reset Password";
    if(view === "forgot-password-submit") return "Set New Password";
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 cursor-pointer"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <Tractor className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {getTitle()}
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg">
              {successMsg}
            </div>
          )}

          {view === "signup" && (
            <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
              {["buyer", "vendor"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all capitalize cursor-pointer ${role === r ? "bg-white shadow text-green-700" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {r === "buyer" ? <User className="h-4 w-4" /> : <Store className="h-4 w-4" />}
                  {r === "vendor" ? "Farmer" : "Buyer"}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NAME */}
            {view === "signup" && (
              <input
                type="text"
                required
                placeholder="Full Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            )}

            {/* EMAIL - Hidden on step 2 of reset to avoid confusion, or keep readOnly */}
            {view !== "confirm" && view !== "forgot-password-submit" && (
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  placeholder="Email"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            )}

            {/* PASSWORD (Used for Login, Signup, AND New Password) */}
            {(view === "signup" || view === "login" || view === "forgot-password-submit") && (
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder={view === "forgot-password-submit" ? "New Password" : "Password"}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            )}

            {/* CODE INPUT (Used for Email Confirm AND Password Reset Confirm) */}
            {(view === "confirm" || view === "forgot-password-submit") && (
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Verification Code"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
                {view === "confirm" && (
                    <p className="text-xs text-right mt-1 text-gray-500 cursor-pointer hover:text-green-600"
                    onClick={async () => { await resendSignUpCode({ username: formData.email }); setSuccessMsg("Code resent!"); }}>
                    Resend Code
                    </p>
                )}
              </div>
            )}

            {/* HELPERS */}
            {view === "login" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setView("forgot-password")}
                  className="text-sm font-medium text-green-600 cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg flex justify-center items-center cursor-pointer"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : view === "login" ? (
                "Sign In"
              ) : view === "signup" ? (
                "Create Account"
              ) : view === "confirm" ? (
                "Verify Code"
              ) : view === "forgot-password" ? (
                "Send Reset Link"
              ) : (
                "Change Password"
              )}
            </button>
          </form>

          {/* FOOTER */}
          <div className="mt-6 text-center text-sm text-gray-500">
            {view === "login" ? (
              <button onClick={() => setView("signup")} className="font-semibold text-green-600 cursor-pointer">
                Sign up
              </button>
            ) : view === "signup" ? (
              <button onClick={() => setView("login")} className="font-semibold text-green-600 cursor-pointer">
                Log in
              </button>
            ) : (
              <button onClick={() => setView("login")} className="font-semibold text-green-600 flex items-center justify-center gap-1 mx-auto cursor-pointer">
                <ArrowLeft className="h-4 w-4" /> Back to Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}