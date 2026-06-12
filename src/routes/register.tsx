import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { SuperAdminAPI } from "@/services/super-admin.service";
import {
  GraduationCap,
  Shield,
  RefreshCw,
  BookOpen,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Building,
  Upload,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  ArrowRight,
  ArrowLeft,
  Search,
  Sparkles,
  Lock,
  User,
  Layers,
  FileCode,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── ROUTE DEFINITION ──
export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Universal Portal Enrollment · Campus OS" },
      {
        name: "description",
        content: "Register a new School Admin, Teacher, Student, or Parent profile.",
      },
    ],
  }),
  component: RegisterPage,
});

// ── MOCK DATA ──
const PLANS = [
  {
    id: "free",
    name: "Free Plan",
    monthlyPrice: 0,
    students: "Up to 50",
    teachers: "Up to 5",
    storage: "1 GB",
    support: "Community support",
    modules: ["Academics Basics", "Attendance Logs"],
    badge: "Starter",
  },
  {
    id: "paid",
    name: "Paid Plan",
    monthlyPrice: 1299,
    students: "Up to 500",
    teachers: "Up to 50",
    storage: "50 GB",
    support: "Priority support",
    modules: ["Academics", "Finance Hub", "AI Hub Beta"],
    badge: "Most Popular",
    popular: true,
  },
];

const SUBSCRIPTION_DURATIONS = [
  { months: 1, label: "1 Month", discount: 0 },
  { months: 3, label: "3 Months", discount: 0.08 },
  { months: 6, label: "6 Months", discount: 0.12 },
  { months: 9, label: "9 Months", discount: 0.16 },
  { months: 12, label: "1 Year", discount: 0.2 },
];

const BOARDS_BY_TYPE: Record<string, string[]> = {
  "K–12 School": ["CBSE", "ICSE-ISC", "State Board", "IB", "Cambridge"],
  "Integrated School": ["CBSE", "ICSE-ISC", "State Board", "IB", "Cambridge"],
  "Senior Secondary School": ["CBSE", "ICSE-ISC", "State Board"],
  "International School": ["IB", "Cambridge"],
};


function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<"school" | "super_admin">("school");

  // Fetch plans from backend database
  const { data: dbPlans } = useQuery({
    queryKey: ['publicPlans'],
    queryFn: () => apiClient<any[]>("/auth/plans")
  });

  // ── SCHOOL ADMIN SUBSCRIPTION-FIRST FLOW STATE ──
  const [schoolStep, setSchoolStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [registeredSchoolId, setRegisteredSchoolId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("paid");
  const [selectedDurationMonths, setSelectedDurationMonths] = useState(1);
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "net" | "wallet">("upi");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "success" | "failed">(
    "idle",
  );
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaText, setCaptchaText] = useState(() => generateCaptchaText());
  const [captchaError, setCaptchaError] = useState("");
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Form State: Step 1 Pre-Reg
  const [schoolPreReg, setSchoolPreReg] = useState({
    schoolName: "",
    adminName: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    country: "India",
    schoolType: "K–12 School",
    board: "CBSE",
    password: "",
    confirmPassword: "",
  });

  const [superAdminReg, setSuperAdminReg] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Form State: Step 4 Post-Reg Details
  const [schoolPostReg, setSchoolPostReg] = useState({
    logo: "",
    address1: "",
    address2: "",
    pinCode: "",
    regNumber: "",
    affiliationNumber: "",
    establishmentYear: "2020",
    website: "",
    motto: "",
    designation: "Principal",
    adminPhoto: "",
    approxStudents: "500",
    approxTeachers: "40",
    referral: "",
    acceptTerms: true,
  });

  const [generatedSchoolId, setGeneratedSchoolId] = useState("");

  const plansList = dbPlans && dbPlans.length > 0
    ? dbPlans.map((plan: any) => ({
        id: plan.code.toLowerCase(), // e.g. "free_trial", "basic", "standard", "premium", "enterprise"
        name: plan.name,
        monthlyPrice: plan.price,
        billingCycle: plan.billingCycle || "MONTHLY",
        currency: plan.currency || "USD",
        currencySymbol: plan.currency === 'INR' ? '₹' : '$',
        students: `Up to ${plan.limits?.maxStudents || 0}`,
        teachers: `Up to ${plan.limits?.maxTeachers || 0}`,
        storage: `${((plan.limits?.maxStorageBytes || 0) / (1024 * 1024 * 1024)).toFixed(0)} GB`,
        support: plan.price > 0 ? "Priority support" : "Community support",
        modules: plan.features || [],
        badge: plan.code,
        popular: plan.code === 'STANDARD',
        dbId: plan._id || plan.id
      }))
    : PLANS.map((plan) => ({
        ...plan,
        billingCycle: "MONTHLY",
        currency: "INR",
        currencySymbol: "₹",
        dbId: plan.id
      }));

  // ── HANDLERS ──

  // Coupon apply logic
  const handleApplyCoupon = () => {
    const code = promoCode.toUpperCase().trim();
    if (code === "SAVE20") {
      setAppliedDiscount({ code: "SAVE20", percent: 20 });
      toast.success("Promo Code Saved!", { description: "20% discount applied to your order." });
    } else if (code === "WINTER50") {
      setAppliedDiscount({ code: "WINTER50", percent: 50 });
      toast.success("Promo Code Active!", { description: "50% introductory discount applied." });
    } else {
      toast.error("Invalid Promo Code", {
        description: "Try entering SAVE20 or WINTER50 for a demo discount.",
      });
    }
  };

  function generateCaptchaText() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  const refreshCaptcha = () => {
    setCaptchaText(generateCaptchaText());
    setCaptchaInput("");
    setCaptchaVerified(false);
    setCaptchaError("");
  };

  const handleCaptchaVerify = () => {
    if (captchaInput.trim().toUpperCase() === captchaText) {
      setCaptchaVerified(true);
      setCaptchaError("");
      toast.success("Captcha verified", {
        description: "Human verification passed successfully.",
      });
      return;
    }

    setCaptchaVerified(false);
    setCaptchaError("Incorrect CAPTCHA. Please try again.");
    refreshCaptcha();
    toast.error("Verification failed", {
      description: "The CAPTCHA text did not match. A new code has been generated.",
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Maximum logo file size is 25MB.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSchoolPostReg((prev) => ({
          ...prev,
          logo: event.target!.result as string,
        }));
        toast.success("Logo uploaded!", {
          description: "Your school brand logo has been loaded.",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadInvoice = () => {
    const content = `=====================================================
                 CAMPUS OS INVOICE RECEIPT
=====================================================
Invoice Date:      ${activationDate}
Transaction ID:    ${transactionId}
Status:            PAID
-----------------------------------------------------
CUSTOMER DETAILS
School Name:       ${schoolPreReg.schoolName || "Campus OS School"}
School ID:         ${generatedSchoolId || "SCH-2026-XXXX"}
Admin Email:       ${schoolPreReg.email || "admin@school.com"}
Phone:             ${schoolPreReg.phone || "N/A"}
Address:           ${schoolPostReg.address1 || ""}${schoolPostReg.address2 ? ", " + schoolPostReg.address2 : ""}, ${schoolPreReg.city || ""}, ${schoolPreReg.state || ""}, ${schoolPostReg.pinCode || ""}
-----------------------------------------------------
BILLING SUMMARY
Selected Plan:     ${activePlan.name}
Billing Duration:  ${selectedDuration.label}
-----------------------------------------------------
Base Price:        ${activePlan.currencySymbol}${rawPrice.toLocaleString()}
Discount:          ${appliedDiscount ? `-${activePlan.currencySymbol}${discountAmount.toLocaleString()}` : `${activePlan.currencySymbol}0`}
Tax / GST (18%):   ${activePlan.currencySymbol}${taxAmount.toFixed(0)}
-----------------------------------------------------
TOTAL AMOUNT:      ${activePlan.currencySymbol}${totalPrice.toFixed(0)}
=====================================================
             Thank you for choosing Campus OS!
=====================================================`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice_${transactionId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Invoice downloaded successfully.");
  };

  // Step 1 Submit
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (schoolPreReg.password !== schoolPreReg.confirmPassword) {
      toast.error("Passwords mismatch", { description: "Please match your passwords." });
      return;
    }
    if (!captchaVerified) {
      toast.error("Human verification required", {
        description: "Please complete the CAPTCHA check before continuing.",
      });
      return;
    }

    if (true) { // useBackend
      setLoading(true);
      const code = "SCH-2026-" + Math.floor(1000 + Math.random() * 9000);
      setGeneratedSchoolId(code);
      try {
        const regRes = await apiClient<any>("/auth/register", {
          method: "POST",
          data: {
            email: schoolPreReg.email,
            password: schoolPreReg.password,
            firstName: schoolPreReg.adminName.split(" ")[0] || schoolPreReg.adminName,
            lastName: schoolPreReg.adminName.split(" ").slice(1).join(" ") || "Admin",
            role: "SCHOOL_ADMIN",
            schoolName: schoolPreReg.schoolName,
            schoolCode: code,
          },
        });

        if (regRes && regRes.schoolId) {
          setRegisteredSchoolId(regRes.schoolId);
        }

        toast.success("Account created!", {
          description: "Check your email for the confirmation link.",
        });
      } catch (err: any) {
        console.error(err);
        toast.error("Registration failed", { description: err.message || "An unexpected error occurred during signup." });
        return;
      } finally {
        setLoading(false);
      }
    }

    setSchoolStep(2);
  };

  const handleSuperAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (superAdminReg.password !== superAdminReg.confirmPassword) {
      toast.error("Passwords mismatch", { description: "Please match your passwords." });
      return;
    }

    setLoading(true);
    try {
      await apiClient<any>("/auth/register", {
        method: "POST",
        data: {
          email: superAdminReg.email,
          password: superAdminReg.password,
          fullName: superAdminReg.fullName,
          role: "SUPER_ADMIN",
        },
      });

      toast.success("Account created!", {
        description: "Your Super Admin account has been registered successfully.",
      });

      const loginRes = await login(superAdminReg.email, superAdminReg.password);

      if (loginRes.success) {
        toast.success("Logged in successfully!");
        navigate({ to: "/super-admin" });
      } else {
        toast.info("Registration succeeded, please log in manually.");
        navigate({ to: "/login" });
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Registration failed", {
        description: err.message || "An unexpected error occurred during signup.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2 plan selected -> go to payment
  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    const chosenPlan = plansList.find((p) => p.id === planId) || plansList[0]!;
    if (chosenPlan.billingCycle === 'YEARLY') {
      setSelectedDurationMonths(12);
    } else if (planId === "free" || chosenPlan.monthlyPrice === 0) {
      setSelectedDurationMonths(1);
    }
    setSchoolStep(3);
  };

  // Step 3 Payment Processing Simulation
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStatus("pending");
    toast.loading("Contacting payment gateway...", {
      description: "Connecting Razorpay secure channel.",
    });

    try {
      const planCode = activePlan.badge.toUpperCase();
      const amount = activePlan.monthlyPrice > 0 ? rawPrice : 0;

      await apiClient(`/schools/${registeredSchoolId}/subscribe`, {
        method: "POST",
        data: {
          planCode,
          durationMonths: currentDurationMonths,
          amount,
          paymentMethod,
          transactionId
        }
      });

      setPaymentStatus("success");
      toast.dismiss();
      toast.success("Payment Captured & Subscription Activated!", {
        description: "Transaction completed successfully. Ledger saved.",
      });
      setSchoolStep(4);
    } catch (err: any) {
      console.error("Subscription payment error:", err);
      setPaymentStatus("failed");
      toast.dismiss();
      toast.error("Subscription Activation Failed", {
        description: err.message || "Failed to finalize subscription. Please try again."
      });
    }
  };

  // Active Plan Details
  const activePlan = plansList.find((p) => p.id === selectedPlanId) || plansList[0]!;
  
  // Force duration to 12 months for yearly plans
  const isYearlyPlan = activePlan.billingCycle === 'YEARLY';
  const currentDurationMonths = isYearlyPlan ? 12 : selectedDurationMonths;

  const selectedDuration =
    SUBSCRIPTION_DURATIONS.find((item) => item.months === currentDurationMonths) ||
    SUBSCRIPTION_DURATIONS[0]!;

  const basePrice = isYearlyPlan 
    ? activePlan.monthlyPrice 
    : activePlan.monthlyPrice * selectedDuration.months;

  const durationDiscount = isYearlyPlan 
    ? 0 
    : basePrice * selectedDuration.discount;
  const rawPrice = Math.max(0, basePrice - durationDiscount);
  const discountAmount = appliedDiscount ? rawPrice * (appliedDiscount.percent / 100) : 0;
  const taxAmount = (rawPrice - discountAmount) * 0.18;
  const totalPrice = rawPrice - discountAmount + taxAmount;
  const transactionId = `TXN-${generatedSchoolId.replace(/\D/g, "").slice(0, 6) || "CAMPUS"}-${Date.now().toString().slice(-4)}`;
  const activationDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="page-mesh min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col items-center justify-between gap-4 border-b border-border/80 pb-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Campus OS</h1>
              <p className="text-xs text-muted-foreground">Universal Cloud Portal Enrollment</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/login" })}
            className="text-xs font-semibold rounded-xl border-indigo-500/30 hover:bg-indigo-500/5 cursor-pointer"
          >
            ← Back to Sign In
          </Button>
        </div>

        {/* PROFILE TAB SWITCHERS (DISABLED ONCE INSIDE POST-REG STEPS OF SCHOOL FLOW) */}
        {!(activeProfileTab === "school" && schoolStep > 1) && (
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-1 shadow-sm md:grid-cols-4">
            <button
              onClick={() => setActiveProfileTab("school")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                activeProfileTab === "school"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
            >
              <Building className="h-4.5 w-4.5" /> School (SaaS)
            </button>
            <button
              onClick={() => setActiveProfileTab("super_admin")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                activeProfileTab === "super_admin"
                  ? "bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
            >
              <Shield className="h-4.5 w-4.5" /> Super Admin
            </button>
          </div>
        )}

        {/* ── PROFILE ROUTE RENDERERS ── */}

        {/* A. SCHOOL ADMIN FLOW (SUBSCRIPTION FIRST FLOW) */}
        {activeProfileTab === "school" && (
          <div className="space-y-6">
            {/* Steps indicator */}
            <div className="flex items-center justify-between px-1.5 pt-1">
              {[
                { s: 1, label: "Complete Onboarding" },
                { s: 2, label: "Select Plan" },
                { s: 3, label: "Secure Payment" },
                { s: 4, label: "Activation" },
              ].map((step) => (
                <div key={step.s} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-full text-xs font-bold shadow-sm transition-all duration-300",
                      schoolStep === step.s
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-500/20"
                        : schoolStep > step.s
                          ? "bg-emerald-500 text-white"
                          : "bg-muted text-muted-foreground border border-border",
                    )}
                  >
                    {step.s}
                  </div>
                  <span
                    className={cn(
                      "hidden text-xs font-bold tracking-tight md:inline",
                      schoolStep === step.s
                        ? "text-indigo-600 font-extrabold"
                        : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                  {step.s < 4 && (
                    <span className="hidden text-muted-foreground/35 md:inline">➔</span>
                  )}
                </div>
              ))}
            </div>

            {/* STEP 1: PRE-REGISTRATION */}
            {schoolStep === 1 && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-md space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Step 1 — SaaS School Onboarding
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Register basic coordinates to secure a temporary trial instance.
                  </p>
                </div>
                <form onSubmit={handleStep1Submit} className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      School Legal Name
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Oakwood International School"
                      value={schoolPreReg.schoolName}
                      onChange={(e) =>
                        setSchoolPreReg({ ...schoolPreReg, schoolName: e.target.value })
                      }
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Owner / Director Full Name
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Dr. Evelyn Vance"
                      value={schoolPreReg.adminName}
                      onChange={(e) =>
                        setSchoolPreReg({ ...schoolPreReg, adminName: e.target.value })
                      }
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Official Admin Email Address
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="principal@school.com"
                      value={schoolPreReg.email}
                      onChange={(e) => setSchoolPreReg({ ...schoolPreReg, email: e.target.value })}
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Contact Phone Number
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="+91 9876543210"
                      value={schoolPreReg.phone}
                      onChange={(e) => setSchoolPreReg({ ...schoolPreReg, phone: e.target.value })}
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      City
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Seattle"
                      value={schoolPreReg.city}
                      onChange={(e) => setSchoolPreReg({ ...schoolPreReg, city: e.target.value })}
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      State / District
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Washington"
                      value={schoolPreReg.state}
                      onChange={(e) => setSchoolPreReg({ ...schoolPreReg, state: e.target.value })}
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      School Scope / Type
                    </label>
                    <select
                      value={schoolPreReg.schoolType}
                      onChange={(e) => {
                        const newType = e.target.value;
                        const allowedBoards = BOARDS_BY_TYPE[newType] || [];
                        setSchoolPreReg({
                          ...schoolPreReg,
                          schoolType: newType,
                          board: allowedBoards[0] || "",
                        });
                      }}
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none cursor-pointer"
                    >
                      <option value="K–12 School">K–12 School</option>
                      <option value="Integrated School">Integrated School</option>
                      <option value="Senior Secondary School">Senior Secondary School</option>
                      <option value="International School">International School</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Affiliated Board
                    </label>
                    <select
                      value={schoolPreReg.board}
                      onChange={(e) => setSchoolPreReg({ ...schoolPreReg, board: e.target.value })}
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none cursor-pointer"
                    >
                      {(BOARDS_BY_TYPE[schoolPreReg.schoolType] || []).map((board) => (
                        <option key={board} value={board}>
                          {board}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      SaaS Portal Password
                    </label>
                    <input
                      required
                      type="password"
                      minLength={6}
                      placeholder="••••••••"
                      value={schoolPreReg.password}
                      onChange={(e) =>
                        setSchoolPreReg({ ...schoolPreReg, password: e.target.value })
                      }
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Confirm Password
                    </label>
                    <input
                      required
                      type="password"
                      minLength={6}
                      placeholder="••••••••"
                      value={schoolPreReg.confirmPassword}
                      onChange={(e) =>
                        setSchoolPreReg({ ...schoolPreReg, confirmPassword: e.target.value })
                      }
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* CAPTCHA Verification Section */}
                  <div className="md:col-span-2 rounded-2xl border border-dashed border-indigo-500/20 bg-indigo-500/5 p-4 shadow-sm">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                          <Shield className="h-4 w-4 text-indigo-400" />
                          Human Verification
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Type the displayed CAPTCHA text to prove you are human before continuing.
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600">Protected</span>
                    </div>

                    <div className="mt-4 rounded-xl border border-border bg-card/90 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="select-none rounded-xl border border-dashed border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-pink-500/10 px-4 py-3 text-xl font-black tracking-[0.35em] text-foreground shadow-inner"
                            style={{
                              transform: `rotate(-3deg) skewX(-6deg)`,
                              letterSpacing: "0.35em",
                              fontFamily: "monospace",
                            }}
                          >
                            {captchaText}
                          </div>
                          <button
                            type="button"
                            onClick={refreshCaptcha}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted/60 text-muted-foreground transition hover:-translate-y-0.5 hover:bg-muted hover:text-foreground"
                            aria-label="Refresh CAPTCHA"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex flex-1 flex-col gap-2 lg:max-w-xs">
                          <input
                            type="text"
                            value={captchaInput}
                            onChange={(e) => {
                              setCaptchaInput(e.target.value.toUpperCase());
                              if (captchaError) setCaptchaError("");
                            }}
                            placeholder="Enter the CAPTCHA text"
                            className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={handleCaptchaVerify}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg cursor-pointer transition-transform duration-200 active:scale-[0.98]"
                          >
                            Verify CAPTCHA
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Lock className="h-3.5 w-3.5 text-indigo-400" />
                        {captchaVerified
                          ? "Verified successfully. You can continue to the next step."
                          : "Refresh the code anytime if it is hard to read."}
                      </div>
                      {captchaError && <p className="mt-2 text-[10px] font-semibold text-rose-500">{captchaError}</p>}
                    </div>
                  </div>

                  <div className="md:col-span-2 border-t border-border/60 pt-4" />

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      School Brand Logo
                    </label>
                    <div className="flex gap-4 items-center p-4 border border-dashed border-border rounded-xl bg-muted/10">
                      {schoolPostReg.logo ? (
                        <div className="relative h-12 w-12 rounded-lg border border-border bg-card overflow-hidden flex items-center justify-center">
                          <img
                            src={schoolPostReg.logo}
                            alt="School Logo Preview"
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-indigo-500/10 border border-indigo-500/25 grid place-items-center text-indigo-400">
                          <Upload className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <input
                          type="file"
                          id="school-logo-input"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById("school-logo-input")?.click()}
                          className="text-xs font-bold text-indigo-500 hover:underline cursor-pointer"
                        >
                          {schoolPostReg.logo ? "Change Logo" : "Upload image payload"}
                        </button>
                        {schoolPostReg.logo && (
                          <button
                            type="button"
                            onClick={() => setSchoolPostReg(prev => ({ ...prev, logo: "" }))}
                            className="ml-3 text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                        <div className="text-[9px] text-muted-foreground mt-0.5">
                          Maximum upload size allowed under core quotas: 25MB.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Address Line 1
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 742 Evergreen Terrace"
                      value={schoolPostReg.address1}
                      onChange={(e) => setSchoolPostReg({ ...schoolPostReg, address1: e.target.value })}
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Suite 400"
                      value={schoolPostReg.address2}
                      onChange={(e) => setSchoolPostReg({ ...schoolPostReg, address2: e.target.value })}
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Postal Pin / ZIP Code
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 98101"
                      value={schoolPostReg.pinCode}
                      onChange={(e) => setSchoolPostReg({ ...schoolPostReg, pinCode: e.target.value })}
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Govt. School Registration No.
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. REG-389-91A"
                      value={schoolPostReg.regNumber}
                      onChange={(e) => setSchoolPostReg({ ...schoolPostReg, regNumber: e.target.value })}
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      School Board Affiliation No.
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. AFFIL-2024-0012"
                      value={schoolPostReg.affiliationNumber}
                      onChange={(e) => setSchoolPostReg({ ...schoolPostReg, affiliationNumber: e.target.value })}
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Year of Establishment
                    </label>
                    <input
                      required
                      type="number"
                      placeholder="2010"
                      value={schoolPostReg.establishmentYear}
                      onChange={(e) => setSchoolPostReg({ ...schoolPostReg, establishmentYear: e.target.value })}
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      School Website URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://oakwood.edu"
                      value={schoolPostReg.website}
                      onChange={(e) => setSchoolPostReg({ ...schoolPostReg, website: e.target.value })}
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Admin Designation
                    </label>
                    <select
                      value={schoolPostReg.designation}
                      onChange={(e) => setSchoolPostReg({ ...schoolPostReg, designation: e.target.value })}
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs cursor-pointer"
                    >
                      <option value="Principal">Principal</option>
                      <option value="Director">Director / Chairman</option>
                      <option value="Owner">School Owner</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Approx Students Count
                    </label>
                    <input
                      required
                      type="number"
                      placeholder="400"
                      value={schoolPostReg.approxStudents}
                      onChange={(e) => setSchoolPostReg({ ...schoolPostReg, approxStudents: e.target.value })}
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Approx Teachers Count
                    </label>
                    <input
                      required
                      type="number"
                      placeholder="35"
                      value={schoolPostReg.approxTeachers}
                      onChange={(e) => setSchoolPostReg({ ...schoolPostReg, approxTeachers: e.target.value })}
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                    />
                  </div>

                  <div className="md:col-span-2 pt-2">
                    <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer select-none">
                      <input
                        required
                        type="checkbox"
                        checked={schoolPostReg.acceptTerms}
                        onChange={(e) => setSchoolPostReg({ ...schoolPostReg, acceptTerms: e.target.checked })}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                      />
                      <span>
                        I hereby accept Campus OS terms of service and GDPR data protection policies.
                      </span>
                    </label>
                  </div>

                  <div className="md:col-span-2 pt-4 flex justify-end">
                    <Button
                      type="submit"
                      disabled={!captchaVerified}
                      className="rounded-xl px-6 gap-2"
                    >
                      Continue to Plan Selection <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 2: CHOOSE SUBSCRIPTION PLAN */}
            {schoolStep === 2 && (
              <div className="space-y-6">
                <div className="flex flex-col justify-between items-start gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Step 2 — Select Pricing Subscription</h3>
                    <p className="text-xs text-muted-foreground">
                      Pick the plan that fits your school and choose a subscription duration.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSchoolStep(1)}
                    className="rounded-xl border-border text-xs font-semibold"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Complete Onboarding
                  </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="grid gap-6 md:grid-cols-2">
                    {plansList.map((plan) => {
                      const active = plan.id === selectedPlanId;
                      const isPaid = plan.monthlyPrice > 0;
                      const displayPrice = isPaid
                        ? (plan.billingCycle === 'YEARLY'
                            ? plan.monthlyPrice
                            : Math.max(0, plan.monthlyPrice * selectedDuration.months * (1 - selectedDuration.discount)))
                        : 0;

                      return (
                        <article
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={cn(
                            "relative flex h-full cursor-pointer flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-md",
                            active
                              ? "border-indigo-600 bg-indigo-500/5 ring-2 ring-indigo-500/20 shadow-lg"
                              : "border-border",
                          )}
                        >
                          {plan.popular && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest text-white shadow-sm">
                              {plan.badge}
                            </span>
                          )}

                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500">{plan.badge}</p>
                              <h4 className="mt-1 text-lg font-extrabold text-foreground">{plan.name}</h4>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {isPaid
                                  ? "Flexible subscription billing for growing schools."
                                  : "Perfect for exploring the platform with no billing commitment."}
                              </p>
                            </div>
                            <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                              <div className="flex items-end gap-1 text-foreground">
                                <span className="text-3xl font-extrabold tracking-tight">{plan.currencySymbol}{displayPrice.toLocaleString()}</span>
                                <span className="pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">total</span>
                              </div>
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                {isPaid
                                  ? (plan.billingCycle === 'YEARLY'
                                      ? "Billed annually"
                                      : `${selectedDuration.label} · ${selectedDuration.months} month${selectedDuration.months > 1 ? "s" : ""} billing`)
                                  : "No payment required for this tier."}
                              </p>
                            </div>
                            <div className="space-y-2 text-xs text-muted-foreground">
                              <div className="flex justify-between"><span>Students</span><strong className="text-foreground">{plan.students}</strong></div>
                              <div className="flex justify-between"><span>Teachers</span><strong className="text-foreground">{plan.teachers}</strong></div>
                              <div className="flex justify-between"><span>Storage</span><strong className="text-foreground">{plan.storage}</strong></div>
                              <div className="flex justify-between"><span>Support</span><strong className="text-foreground">{plan.support}</strong></div>
                            </div>
                            <div className="flex flex-wrap gap-1 pt-1">
                              {plan.modules.map((item) => (
                                <span key={item} className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">{item}</span>
                              ))}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlanId(plan.id);
                              if (plan.billingCycle === 'YEARLY') {
                                setSelectedDurationMonths(12);
                              } else if (plan.monthlyPrice === 0) {
                                setSelectedDurationMonths(1);
                              }
                            }}
                            className={cn(
                              "mt-4 rounded-xl px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all",
                              active
                                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                : "border border-border bg-transparent text-foreground hover:bg-muted",
                            )}
                          >
                            {active ? "Selected Plan" : "Choose This Plan"}
                          </button>
                        </article>
                      );
                    })}
                  </div>

                  <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Subscription duration</p>
                      <h4 className="mt-1 text-lg font-extrabold text-foreground">Choose billing length</h4>
                      <p className="text-xs text-muted-foreground">
                        {isYearlyPlan 
                          ? "This plan is billed annually." 
                          : "The plan price updates instantly for the selected duration."}
                      </p>
                    </div>
                    <div className="grid gap-2">
                      {isYearlyPlan ? (
                        <div className="flex items-center justify-between rounded-xl border border-indigo-600 bg-indigo-500/5 px-3 py-3 text-left transition-all shadow-sm">
                          <span>
                            <span className="block text-xs font-semibold text-foreground">1 Year</span>
                            <span className="text-[10px] text-muted-foreground">Billed annually</span>
                          </span>
                          <span className="text-xs font-extrabold text-indigo-600">
                            {activePlan.currencySymbol}{activePlan.monthlyPrice.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        SUBSCRIPTION_DURATIONS.map((option) => {
                          const price = Math.max(0, activePlan.monthlyPrice * option.months * (1 - option.discount));
                          const active = option.months === selectedDurationMonths;
                          return (
                            <button
                              key={option.months}
                              type="button"
                              onClick={() => setSelectedDurationMonths(option.months)}
                              className={cn(
                                "flex items-center justify-between rounded-xl border px-3 py-3 text-left transition-all",
                                active
                                  ? "border-indigo-600 bg-indigo-500/5 shadow-sm"
                                  : "border-border hover:bg-muted/60",
                              )}
                            >
                              <span>
                                <span className="block text-xs font-semibold text-foreground">{option.label}</span>
                                <span className="text-[10px] text-muted-foreground">Best for flexible school rollout</span>
                              </span>
                              <span className="text-xs font-extrabold text-indigo-600">
                                {activePlan.currencySymbol}{price.toLocaleString()}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                    <div className="rounded-xl border border-dashed border-indigo-500/20 bg-indigo-500/5 p-4 text-xs text-muted-foreground">
                      <strong className="text-foreground">Selected summary:</strong> {activePlan.name} · {selectedDuration.label} · {activePlan.currencySymbol}{totalPrice.toLocaleString(undefined, {maximumFractionDigits: 0})} total.
                    </div>
                  </aside>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/80">
                  <button
                    onClick={() => setSchoolStep(1)}
                    className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to onboarding form
                  </button>
                  <Button onClick={() => handleSelectPlan(selectedPlanId)} className="rounded-xl px-6">
                    Continue to Payment <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: PAYMENT GATEWAY */}
            {schoolStep === 3 && (
              <div className="grid gap-6 md:grid-cols-3">
                {/* PAYMENT GATEWAY SIMULATION */}
                <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-md space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      Step 3 — Secure Gateway Integration
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Simulated Razorpay & Stripe transaction authorization panel.
                    </p>
                  </div>

                  <form onSubmit={handlePaymentSubmit} className="space-y-5">
                    {/* Method Selector */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Choose Payment Method
                      </label>
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        {[
                          { id: "upi", name: "UPI Pay", desc: "Paytm, GPay, PhonePe" },
                          { id: "card", name: "Cards", desc: "Credit/Debit card" },
                          { id: "net", name: "NetBanking", desc: "Direct bank transfer" },
                          { id: "wallet", name: "Wallets", desc: "Amazon, Razorpay" },
                        ].map((method) => {
                          const active = paymentMethod === method.id;
                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setPaymentMethod(method.id as any)}
                              className={cn(
                                "p-3 rounded-xl border text-left transition-all cursor-pointer",
                                active
                                  ? "border-indigo-600 bg-indigo-500/5 shadow-md shadow-indigo-600/10"
                                  : "border-border hover:bg-muted/45 text-muted-foreground",
                              )}
                            >
                              <CreditCard
                                className={cn(
                                  "h-5 w-5 mb-1",
                                  active ? "text-indigo-500" : "text-muted-foreground",
                                )}
                              />
                              <div className="text-xs font-bold text-foreground leading-none">
                                {method.name}
                              </div>
                              <div className="text-[9px] text-muted-foreground leading-normal mt-0.5">
                                {method.desc}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Method detail boxes */}
                    {paymentMethod === "upi" && (
                      <div className="bg-muted/20 border border-border p-4 rounded-xl space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Enter UPI ID / VPA
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. principal@upi"
                          className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}

                    {paymentMethod === "card" && (
                      <div className="bg-muted/20 border border-border p-4 rounded-xl space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Cardholder Name
                          </label>
                          <input
                            required
                            type="text"
                            placeholder="Evelyn Vance"
                            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Card Number
                            </label>
                            <input
                              required
                              type="text"
                              maxLength={16}
                              placeholder="4111 2222 3333 4444"
                              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Expiry
                              </label>
                              <input
                                required
                                type="text"
                                maxLength={5}
                                placeholder="12/28"
                                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none text-center"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                CVV
                              </label>
                              <input
                                required
                                type="password"
                                maxLength={3}
                                placeholder="•••"
                                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none text-center"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                      <button
                        type="button"
                        onClick={() => setSchoolStep(2)}
                        className="text-xs text-muted-foreground font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="h-4 w-4" /> Go Back
                      </button>
                      <Button
                        type="submit"
                        disabled={paymentStatus === "pending"}
                        className="rounded-xl px-8 gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md"
                      >
                        <CheckCircle className="h-4 w-4" /> Authorize & Pay {activePlan.currencySymbol}{totalPrice.toFixed(0)}
                      </Button>
                    </div>
                  </form>
                </div>

                {/* ORDER SUMMARY */}
                <div className="rounded-2xl border border-border bg-card p-5 shadow-md h-fit space-y-4">
                  <h4 className="font-extrabold text-xs text-foreground uppercase tracking-wider border-b border-border/80 pb-2">
                    Order Cart Ledger
                  </h4>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Selected Plan:</span>
                      <strong className="text-foreground">{activePlan.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subscription:</span>
                      <strong className="text-foreground">{selectedDuration.label}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Price:</span>
                      <strong className="text-foreground">{activePlan.currencySymbol}{rawPrice.toLocaleString()}</strong>
                    </div>

                    {appliedDiscount && (
                      <div className="flex justify-between text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-1 rounded">
                        <span>Coupon ({appliedDiscount.code}):</span>
                        <span>- {activePlan.currencySymbol}{discountAmount.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-border/40 pt-2 text-[11px] font-semibold">
                      <span className="text-muted-foreground">Tax / 18% GST:</span>
                      <strong className="text-foreground">{activePlan.currencySymbol}{taxAmount.toFixed(0)}</strong>
                    </div>

                    <div className="flex justify-between border-t border-border pt-3 text-sm font-extrabold">
                      <span className="text-indigo-600">Total Payable:</span>
                      <strong className="text-foreground text-base">
                        {activePlan.currencySymbol}{totalPrice.toFixed(0)}
                      </strong>
                    </div>
                  </div>

                  {/* PROMO CODES INPUT */}
                  <div className="pt-2 border-t border-border/60 space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Apply Promo Coupon Code
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Try: SAVE20, WINTER50"
                        className="h-9 flex-1 rounded-lg border border-border bg-card px-2 text-xs uppercase outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1 rounded-lg cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: ACCOUNT ACTIVATION */}
            {schoolStep === 4 && (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-indigo-500/5 md:p-8">
                <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
                  <section className="space-y-6 text-left">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 animate-pulse">
                        <CheckCircle className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-500">Activation Complete</p>
                        <h3 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
                          School account is ready for launch.
                        </h3>
                      </div>
                    </div>

                    <p className="max-w-2xl text-sm text-muted-foreground md:text-[13px]">
                      Your Campus OS school portal has been initialized successfully. This confirmation page summarizes the subscription, payment, and onboarding status in a clean enterprise-ready format.
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {[
                        "Payment Successful",
                        "Account Activated",
                        "Subscription Active",
                      ].map((badge) => (
                        <span
                          key={badge}
                          className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        { label: "School ID", value: generatedSchoolId || "SCH-2026-XXXX", accent: true },
                        { label: "Admin Email", value: schoolPreReg.email || "admin@school.com" },
                        { label: "Selected Plan", value: `${activePlan.name} · ${selectedDuration.label}` },
                        { label: "Payment Status", value: "Captured via Razorpay" },
                      ].map((item) => (
                        <article
                          key={item.label}
                          className="rounded-2xl border border-border bg-muted/20 p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
                        >
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                          <p className={cn("mt-2 text-sm font-semibold", item.accent ? "font-mono text-indigo-500" : "text-foreground")}>
                            {item.value}
                          </p>
                        </article>
                      ))}
                    </div>
                  </section>

                  <aside className="rounded-3xl border border-border bg-gradient-to-b from-card to-muted/10 p-5 shadow-lg shadow-indigo-500/5">
                    <div className="flex items-start justify-between border-b border-border/80 pb-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Invoice & Receipt</p>
                        <h4 className="mt-1 text-xl font-extrabold text-foreground">Order confirmation</h4>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">Paid</span>
                    </div>

                    <div className="mt-4 space-y-4 rounded-2xl border border-border bg-card/90 p-4 shadow-inner">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Transaction ID</span>
                        <strong className="font-mono text-[11px] text-foreground">{transactionId}</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Activation Date</span>
                        <strong className="text-foreground">{activationDate}</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>School</span>
                        <strong className="text-foreground">{schoolPreReg.schoolName || "Campus OS School"}</strong>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-border/70 pb-2">
                        <span className="text-muted-foreground">Billing Summary</span>
                        <strong className="text-foreground">{activePlan.currencySymbol}{rawPrice.toLocaleString()}</strong>
                      </div>
                      <div className="flex items-center justify-between border-b border-border/70 pb-2">
                        <span className="text-muted-foreground">Discount</span>
                        <strong className={appliedDiscount ? "text-emerald-500" : "text-foreground"}>
                          {appliedDiscount ? `-${activePlan.currencySymbol}${discountAmount.toLocaleString()}` : `${activePlan.currencySymbol}0`}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between border-b border-border/70 pb-2">
                        <span className="text-muted-foreground">Tax / GST (18%)</span>
                        <strong className="text-foreground">{activePlan.currencySymbol}{taxAmount.toFixed(0)}</strong>
                      </div>
                      <div className="flex items-center justify-between pt-1 text-sm font-extrabold text-foreground">
                        <span>Total</span>
                        <span className="text-indigo-500">{activePlan.currencySymbol}{totalPrice.toFixed(0)}</span>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-dashed border-indigo-500/25 bg-indigo-500/5 p-4 text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground">Subscription details</p>
                      <p className="mt-1">{activePlan.name} · {isYearlyPlan ? "Annual billing window" : `${selectedDuration.label} · ${selectedDuration.months} month${selectedDuration.months > 1 ? "s" : ""} billing window`}.</p>
                    </div>
                  </aside>
                </div>

                <div className="mt-8 flex flex-col items-stretch justify-between gap-3 border-t border-border/80 pt-6 md:flex-row md:items-center">
                  <div className="text-sm text-muted-foreground">
                    Everything is set. You can download the invoice or move straight into the admin dashboard.
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      variant="outline"
                      onClick={handleDownloadInvoice}
                      className="rounded-xl border-indigo-500/30 bg-white/5 px-5 text-xs font-semibold text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-500/5 md:min-w-[190px]"
                    >
                      <FileText className="mr-2 h-4 w-4" /> Download Invoice PDF
                    </Button>
                    <Button
                      onClick={() => {
                        toast.success(`Welcome to ${schoolPreReg.schoolName}! Logging you in as School Admin.`);
                        navigate({ to: "/admin" });
                      }}
                      className="rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500 px-6 text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl md:min-w-[210px]"
                    >
                      Go to Admin Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* C. SUPER ADMIN REGISTRATION FLOW */}
        {activeProfileTab === "super_admin" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-md space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Super Admin Onboarding
                </h3>
                <p className="text-xs text-muted-foreground">
                  Create a new platform-level Super Administrator account.
                </p>
              </div>
              <form onSubmit={handleSuperAdminSubmit} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Full Name
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Alex Mercer"
                    value={superAdminReg.fullName}
                    onChange={(e) =>
                      setSuperAdminReg({ ...superAdminReg, fullName: e.target.value })
                    }
                    className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="e.g. superadmin@campus.os"
                    value={superAdminReg.email}
                    onChange={(e) =>
                      setSuperAdminReg({ ...superAdminReg, email: e.target.value })
                    }
                    className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Password
                  </label>
                  <input
                    required
                    type="password"
                    minLength={6}
                    placeholder="••••••••"
                    value={superAdminReg.password}
                    onChange={(e) =>
                      setSuperAdminReg({ ...superAdminReg, password: e.target.value })
                    }
                    className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Confirm Password
                  </label>
                  <input
                    required
                    type="password"
                    minLength={6}
                    placeholder="••••••••"
                    value={superAdminReg.confirmPassword}
                    onChange={(e) =>
                      setSuperAdminReg({ ...superAdminReg, confirmPassword: e.target.value })
                    }
                    className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2 pt-4 flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl px-6 gap-2 bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-500 hover:-translate-y-0.5"
                  >
                    {loading ? "Registering..." : "Register & Access Dashboard"} <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* B. TEACHER REGISTRATION FORM */}


        {/* COMPARISON MODAL FOR PLANS */}
        {showCompareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCompareModal(false)}
            />
            <div className="relative w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[85vh] flex flex-col justify-between z-10 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start border-b border-border pb-4">
                <div>
                  <h3 className="font-extrabold text-base text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" /> Complete SaaS
                    Plan Feature Comparison Matrix
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Examine precise module allocation gates before authorizing billing cycles.
                  </p>
                </div>
                <button
                  onClick={() => setShowCompareModal(false)}
                  className="text-muted-foreground hover:text-foreground text-sm font-bold bg-muted px-2.5 py-1 rounded-full cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-x-auto my-4 border border-border rounded-xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="p-3 font-extrabold">Feature / Module scope</th>
                      {PLANS.map((p) => (
                        <th
                          key={p.id}
                          className="p-3 font-extrabold text-center border-l border-border/60"
                        >
                          {p.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/40">
                      <td className="p-3 font-semibold text-muted-foreground">Monthly Fee</td>
                      {PLANS.map((p) => (
                        <td
                          key={p.id}
                          className="p-3 text-center border-l border-border/40 font-bold text-foreground"
                        >
                          ₹{p.monthlyPrice.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/40 bg-muted/10">
                      <td className="p-3 font-semibold text-muted-foreground">Max Students Cap</td>
                      {PLANS.map((p) => (
                        <td
                          key={p.id}
                          className="p-3 text-center border-l border-border/40 font-semibold"
                        >
                          {p.students}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/40">
                      <td className="p-3 font-semibold text-muted-foreground">Max Teachers Cap</td>
                      {PLANS.map((p) => (
                        <td
                          key={p.id}
                          className="p-3 text-center border-l border-border/40 font-semibold"
                        >
                          {p.teachers}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/40 bg-muted/10">
                      <td className="p-3 font-semibold text-muted-foreground">
                        Academics Hub (Grades/Timetable)
                      </td>
                      {PLANS.map((p, idx) => (
                        <td
                          key={p.id}
                          className="p-3 text-center border-l border-border/40 text-emerald-500 font-bold"
                        >
                          ✓ Full
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/40">
                      <td className="p-3 font-semibold text-muted-foreground">
                        Finance Hub (Fee Ledger & Tax)
                      </td>
                      {PLANS.map((p, idx) => (
                        <td
                          key={p.id}
                          className="p-3 text-center border-l border-border/40 font-bold"
                        >
                          {idx === 0 ? (
                            <span className="text-muted-foreground/40">✕</span>
                          ) : (
                            <span className="text-emerald-500">✓ Full</span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/40 bg-muted/10">
                      <td className="p-3 font-semibold text-muted-foreground">
                        AI Lessons Planner Node
                      </td>
                      {PLANS.map((p, idx) => (
                        <td
                          key={p.id}
                          className="p-3 text-center border-l border-border/40 font-bold"
                        >
                          {idx < 2 ? (
                            <span className="text-muted-foreground/40">✕</span>
                          ) : (
                            <span className="text-emerald-500">✓ Gemini live</span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/40">
                      <td className="p-3 font-semibold text-muted-foreground">
                        Canteen Mess module
                      </td>
                      {PLANS.map((p, idx) => (
                        <td
                          key={p.id}
                          className="p-3 text-center border-l border-border/40 font-bold"
                        >
                          {idx < 3 ? (
                            <span className="text-muted-foreground/40">✕</span>
                          ) : (
                            <span className="text-emerald-500">✓ Beta Active</span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/40 bg-muted/10">
                      <td className="p-3 font-semibold text-muted-foreground">
                        LMS & SSO webhooks integration
                      </td>
                      {PLANS.map((p, idx) => (
                        <td
                          key={p.id}
                          className="p-3 text-center border-l border-border/40 font-bold"
                        >
                          {idx < 4 ? (
                            <span className="text-rose-500">✕ Custom</span>
                          ) : (
                            <span className="text-emerald-500">✓ Full</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <Button onClick={() => setShowCompareModal(false)} className="rounded-xl">
                  Confirm & Select Card
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
