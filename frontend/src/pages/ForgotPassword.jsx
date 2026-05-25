import { useState, useEffect } from "react";
import {
  forgotPassword,
  verifyResetOTP,
  resendResetOTP
} from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {

  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
  let interval;

  if (step === 2 && timer > 0) {
    interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
  }

  if (timer === 0) {
    setCanResend(true);
  }

  return () => clearInterval(interval);
}, [timer, step]);

  const handleVerify = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {

      await forgotPassword({
  phone: phone.trim()
        });

       setStep(2);

       setSuccess("OTP sent successfully");

       setTimer(60);
       setCanResend(false);

    } catch (err) {

      setError(
        err.response?.data?.detail || "User not found"
      );

    }

    setLoading(false);
  };
  const handleResendOTP = async () => {
  try {
  await resendResetOTP({
    phone: phone.trim()
  });

  alert("New OTP sent");

    setTimer(60);
    setCanResend(false);

   } catch (err) {

  alert(
     err.response?.data?.detail ||
    "Failed to resend OTP"
   );
  }
};

  const handleReset = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {

      await verifyResetOTP({
  phone: phone.trim(),
  otp,
  new_password: newPassword
});

      setSuccess("Password reset successful");

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (err) {

      setError(
        err.response?.data?.detail || "Reset failed"
      );

    }

    setLoading(false);
  };

  return (
    <div style={s.page}>
      <div style={s.card}>

        <div style={s.logo}>🔐</div>

        <h1 style={s.title}>Forgot Password</h1>

        <p style={s.sub}>
          {step === 1
            ? "Verify your phone number"
            : "Create a new password"}
        </p>

        {error && (
          <div style={s.error}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div style={s.success}>
            ✅ {success}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleVerify} style={s.form}>

            <input
              style={s.input}
              type="tel"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <button
              style={s.button}
              type="submit"
              disabled={loading}
            >
              {loading ? "Checking..." : "Continue"}
            </button>

          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleReset} style={s.form}>

            <input
  style={s.input}
  type="text"
  placeholder="Enter OTP"
  value={otp}
  onChange={(e) => setOtp(e.target.value)}
/>

            <input
              style={s.input}
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <button
              style={s.button}
              type="submit"
              disabled={loading}
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
            {canResend ? (
           <button
                type="button"
                style={s.linkBtn}
                onClick={handleResendOTP}
               >
              Resend OTP
           </button>
         ) : (
            <p style={s.timerText}>
             Resend OTP in {timer}s
          </p>
             )}

          </form>
        )}

      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f3ff"
  },

  card: {
    width: 380,
    background: "#fff",
    borderRadius: 16,
    padding: 36,
    boxShadow: "0 10px 40px rgba(0,0,0,.08)"
  },

  timerText: {
     fontSize: "14px",
     color: "#666",
     marginTop: "10px",
     textAlign: "center"
  },

  logo: {
    fontSize: 42,
    textAlign: "center",
    marginBottom: 12
  },

  title: {
    textAlign: "center",
    marginBottom: 6,
    color: "#111827"
  },

  sub: {
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 24,
    fontSize: 14
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14
  },

  input: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    fontSize: 14
  },

  button: {
    padding: 12,
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600
  },

  error: {
    background: "#fef2f2",
    color: "#dc2626",
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    fontSize: 13
  },
  linkBtn: {
  background: "none",
  border: "none",
  color: "#4f46e5",
  cursor: "pointer",
  marginTop: "10px",
  fontSize: "14px"
},

  success: {
    background: "#f0fdf4",
    color: "#166534",
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    fontSize: 13
  }
};