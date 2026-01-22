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
} from "lucide-react";
import {
  signIn,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  fetchAuthSession,
} from "aws-amplify/auth";

export default function AuthModal({ isOpen, onClose }) {
  const [view, setView] = useState("login");
  const [role, setRole] = useState("buyer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
        await confirmSignUp({
          username: formData.email,
          confirmationCode: formData.code,
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
            setError("Please verify your email first.");
            setView("confirm");
            return;
          }
          throw loginErr;
        }
      } else if (view === "forgot-password") {
        await resetPassword({ username: formData.email });
        setSuccessMsg("Reset code sent.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

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
              {view === "login" && "Welcome back"}
              {view === "signup" && "Create an account"}
              {view === "confirm" && "Verify Email"}
              {view === "forgot-password" && "Reset Password"}
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

          {/* Role Selection (Only for Signup) */}
          {view === "signup" && (
            <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
              {["buyer", "vendor"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all capitalize cursor-pointer ${role === r ? "bg-white shadow text-green-700" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {r === "buyer" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Store className="h-4 w-4" />
                  )}{" "}
                  {r === "vendor" ? "Farmer" : "Buyer"}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* --- NAME INPUT --- */}
            {view === "signup" && (
              <input
                type="text"
                required
                placeholder="Full Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            )}

            {/* --- EMAIL INPUT --- */}
            {view !== "confirm" && (
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  placeholder="Email"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            )}

            {/* --- PASSWORD INPUT --- */}
            {(view === "signup" || view === "login") && (
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="Password"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
            )}

            {/* --- CONFIRMATION CODE INPUT --- */}
            {view === "confirm" && (
              <div className="relative">
                <CheckCircle className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="6-digit Code"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                />
                <p
                  className="text-xs text-right mt-1 text-gray-500 cursor-pointer hover:text-green-600"
                  onClick={async () => {
                    await resendSignUpCode({ username: formData.email });
                    setSuccessMsg("Code resent!");
                  }}
                >
                  Resend Code
                </p>
              </div>
            )}

            {/* --- LOGIN HELPERS --- */}
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
              ) : (
                "Send Link"
              )}
            </button>
          </form>

          {/* --- FOOTER NAVIGATION --- */}
          <div className="mt-6 text-center text-sm text-gray-500">
            {view === "login" ? (
              <button
                onClick={() => setView("signup")}
                className="font-semibold text-green-600 cursor-pointer"
              >
                Sign up
              </button>
            ) : view === "signup" ? (
              <button
                onClick={() => setView("login")}
                className="font-semibold text-green-600 cursor-pointer"
              >
                Log in
              </button>
            ) : (
              <button
                onClick={() => setView("login")}
                className="font-semibold text-green-600 flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
