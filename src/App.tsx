import React, { useState, useEffect, useRef } from "react";
import { 
  Phone, 
  Search, 
  Shield, 
  MapPin, 
  PlusCircle, 
  AlertTriangle, 
  CheckCircle, 
  Copy, 
  Share2, 
  Bookmark, 
  Clock, 
  BookOpen, 
  Trash2, 
  Check, 
  X, 
  User, 
  Building, 
  ExternalLink, 
  Info, 
  HelpCircle,
  Activity,
  FileText,
  BarChart3,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { 
  EmergencyCategory, 
  EmergencyContact, 
  ContactSubmission, 
  ContactReport, 
  AuditLog, 
  INDIA_STATES_AND_DISTRICTS,
  AnalyticsSummary
} from "./types";
import StateDistrictSelector from "./components/StateDistrictSelector";

export default function App() {
  // Config state
  const [whatsappNumber, setWhatsappNumber] = useState<string>("9000859695");

  // Sandbox Role & Emulator State
  const [currentRole, setCurrentRole] = useState<"Guest" | "Registered" | "Admin">("Guest");
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("guest@emergency.in");
  const [currentUserId, setCurrentUserId] = useState<string>("guest-session");
  const [userName, setUserName] = useState<string>("Anonymous Guest");
  
  // Theme State
  const [isDark, setIsDark] = useState<boolean>(true);

  // Horizontal Scroll for filter types
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 250;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedState, setSelectedState] = useState<string>("All");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("All");

  // Live datasets
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState<boolean>(false);

  // Admin and interaction state
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [reports, setReports] = useState<ContactReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  // Modal controls
  const [showSubmissionModal, setShowSubmissionModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [selectedContactToReport, setSelectedContactToReport] = useState<EmergencyContact | null>(null);
  const [selectedContactToView, setSelectedContactToView] = useState<EmergencyContact | null>(null);

  // Admin Direct Submission Form Variables
  const [adminServiceName, setAdminServiceName] = useState("");
  const [adminCategory, setAdminCategory] = useState<EmergencyCategory>(EmergencyCategory.POLICE);
  const [adminPhoneNumber, setAdminPhoneNumber] = useState("");
  const [adminState, setAdminState] = useState("National Coverage");
  const [adminDistrict, setAdminDistrict] = useState("All Districts");
  const [adminOrganization, setAdminOrganization] = useState("");
  const [adminDescription, setAdminDescription] = useState("");
  const [adminSourceUrl, setAdminSourceUrl] = useState("");
  const [adminEvidence, setAdminEvidence] = useState("");
  const [adminSuccessMsg, setAdminSuccessMsg] = useState("");
  const [adminErrorMsg, setAdminErrorMsg] = useState("");

  // Security Staff Login Modal state
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");

  // Public/Guest Suggestion/Submit Form Variables
  const [subServiceName, setSubServiceName] = useState("");
  const [subCategory, setSubCategory] = useState<EmergencyCategory>(EmergencyCategory.POLICE);
  const [subPhoneNumber, setSubPhoneNumber] = useState("");
  const [subState, setSubState] = useState("National Coverage");
  const [subDistrict, setSubDistrict] = useState("All Districts");
  const [subOrganization, setSubOrganization] = useState("");
  const [subDescription, setSubDescription] = useState("");
  const [subSourceUrl, setSubSourceUrl] = useState("");
  const [subEvidence, setSubEvidence] = useState("");
  const [subSubmitterName, setSubSubmitterName] = useState("");
  const [subSubmitterEmail, setSubSubmitterEmail] = useState("");
  const [subSuccessMsg, setSubSuccessMsg] = useState("");
  const [subErrorMsg, setSubErrorMsg] = useState("");

  // Report Form Variables
  const [repReason, setRepReason] = useState<"Wrong number" | "Number not working" | "Service unavailable" | "Duplicate entry" | "Fake information" | "Other">("Wrong number");
  const [repDescription, setRepDescription] = useState("");
  const [repEmail, setRepEmail] = useState("");
  const [repSuccessMsg, setRepSuccessMsg] = useState("");
  const [repErrorMsg, setRepErrorMsg] = useState("");

  // Notifications
  const [actionNotification, setActionNotification] = useState<{message: string; type: 'success' | 'info'} | null>(null);

  // Admin notes field per submission ID
  const [adminNotesText, setAdminNotesText] = useState<{ [id: string]: string }>({});

  // Load verified contacts dynamically
  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "All") q.append("category", selectedCategory);
      if (selectedState && selectedState !== "All") q.append("state", selectedState);
      if (selectedDistrict && selectedDistrict !== "All") q.append("district", selectedDistrict);
      if (searchQuery) q.append("search", searchQuery);

      const res = await fetch(`/api/contacts?${q.toString()}`);
      const data = await res.json();
      if (data.contacts) {
        setContacts(data.contacts);
      }
    } catch (err) {
      console.error("Error retrieving contacts list:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Secondary data prefetching for Admin
  const fetchAdminData = async () => {
    if (currentRole !== "Admin") return;
    try {
      const headers = { "x-user-role": "Admin" };
      
      const [subsRes, repsRes, auditRes, analyticsRes] = await Promise.all([
        fetch("/api/admin/submissions", { headers }),
        fetch("/api/admin/reports", { headers }),
        fetch("/api/admin/audit-logs", { headers }),
        fetch("/api/admin/analytics", { headers })
      ]);

      const subsData = await subsRes.json();
      const repsData = await repsRes.json();
      const auditData = await auditRes.json();
      const analyticsData = await analyticsRes.json();

      if (subsData.submissions) setSubmissions(subsData.submissions);
      if (repsData.reports) setReports(repsData.reports);
      if (auditData.logs) setAuditLogs(auditData.logs);
      if (analyticsData.analytics) setAnalytics(analyticsData.analytics);
    } catch (err) {
      console.error("Error retrieving admin console datasets:", err);
    }
  };

  // Fetch configurations on initialize
  useEffect(() => {
    // Generate persistent visitor ID to support robust personal bookmarking
    let storedSessionId = localStorage.getItem("app_public_user_id");
    if (!storedSessionId) {
      storedSessionId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem("app_public_user_id", storedSessionId);
    }
    setCurrentUserId(storedSessionId);

    // Dynamic config parsing from server.ts
    fetch("/api/config")
      .then(res => res.json())
      .then(data => {
        if (data.whatsappNumber) setWhatsappNumber(data.whatsappNumber);
      })
      .catch(err => console.error("Could not load dynamic configuration files:", err));
  }, []);

  // Sync data on changes
  useEffect(() => {
    fetchContacts();
  }, [selectedCategory, selectedState, selectedDistrict, searchQuery]);

  // Sync bookmarks & Admin data when user profile or role state flips
  useEffect(() => {
    if (currentUserId) {
      fetch(`/api/bookmarks?userId=${currentUserId}`)
        .then(res => res.json())
        .then(data => {
          if (data.contacts) {
            const ids = data.contacts.map((c: EmergencyContact) => c.id);
            setBookmarkedIds(ids);
          }
        });
    }
    if (currentRole === "Admin") {
      fetchAdminData();
    }
  }, [currentUserId, currentRole]);

  // Handle Bookmarks Toggle
  const handleToggleBookmark = async (contactId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const res = await fetch(`/api/contacts/${contactId}/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId })
      });
      const data = await res.json();
      if (data.bookmarked !== undefined) {
        if (data.bookmarked) {
          setBookmarkedIds(prev => [...prev, contactId]);
          triggerNotification("Added to standard bookmark list.", "success");
        } else {
          setBookmarkedIds(prev => prev.filter(id => id !== contactId));
          triggerNotification("Removed from bookmark list.", "info");
        }
      }
    } catch (err) {
      console.error("Bookmark toggle issue:", err);
    }
  };

  // Action Notification display helper
  const triggerNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setActionNotification({ message, type });
    setTimeout(() => {
      setActionNotification(null);
    }, 4500);
  };

  // Copy details helper
  const handleCopyNumber = (contact: EmergencyContact, event: React.MouseEvent) => {
    event.stopPropagation();
    navigator.clipboard.writeText(contact.phoneNumber);
    triggerNotification(`Copied ${contact.serviceName} helpline [${contact.phoneNumber}] to clipboard!`, "success");
  };

  // Native share emulated wrapper
  const handleShareContact = (contact: EmergencyContact, event: React.MouseEvent) => {
    event.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: contact.serviceName,
        text: `Emergency Contact: ${contact.serviceName} - Helpline: ${contact.phoneNumber} (${contact.state})`,
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`Emergency: ${contact.serviceName} | Phone: ${contact.phoneNumber} | Info: ${contact.description}`);
      triggerNotification("Contact info generated & copied for instant sharing!", "success");
    }
  };

  // Custom Logins and Registration Flows
  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter both email and password.");
      return;
    }
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentRole(data.user.role);
        setCurrentUserEmail(data.user.email);
        setCurrentUserId(data.user.id);
        setUserName(data.user.name);
        setShowLoginModal(false);
        triggerNotification(`Logged in as ${data.user.name}!`, "success");
        setLoginEmail("");
        setLoginPassword("");
      } else {
        setLoginError(data.error || "Login failed");
      }
    } catch (err) {
      setLoginError("Failed to connect to authentication server.");
    }
  };

  const handleNewSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubErrorMsg("");
    setSubSuccessMsg("");

    if (!subServiceName || !subCategory || !subPhoneNumber || !subState || !subDistrict || !subOrganization || !subDescription || !subSourceUrl) {
      setSubErrorMsg("Please fill out all required fields with accurate information.");
      return;
    }

    try {
      const res = await fetch("/api/contacts/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: subServiceName,
          category: subCategory,
          phoneNumber: subPhoneNumber,
          state: subState,
          district: subDistrict,
          organization: subOrganization,
          description: subDescription,
          sourceUrl: subSourceUrl,
          verificationEvidence: subEvidence,
          submittedBy: currentUserId,
          submitterEmail: subSubmitterEmail || "guest@emergency.in",
          submitterName: subSubmitterName || "Anonymous Resident"
        })
      });
      const data = await res.json();
      if (res.ok) {
        // Reset fields
        setSubServiceName("");
        setSubPhoneNumber("");
        setSubOrganization("");
        setSubDescription("");
        setSubSourceUrl("");
        setSubEvidence("");
        setSubSubmitterName("");
        setSubSubmitterEmail("");
        
        // Form submitted, close the suggestions form
        setShowSubmissionModal(false);
        
        // Show success popup modal in the dead center of the screen
        setSubSuccessMsg("Thank you! Your emergency resource suggestion has been successfully submitted to the Admin review pipeline. Once verified, it will go live.");
        triggerNotification("Resource suggested successfully!", "success");
      } else {
        setSubErrorMsg(data.error || "Failed to submit resource details.");
      }
    } catch (err) {
      setSubErrorMsg("Unable to communicate with the verification database.");
    }
  };

  // Report Incorrect Contact Form handler
  const handleNewReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setRepSuccessMsg("");
    setRepErrorMsg("");

    if (!selectedContactToReport) return;
    if (!repEmail || !repDescription) {
      setRepErrorMsg("Please provide your email and explanation details.");
      return;
    }

    try {
      const res = await fetch(`/api/contacts/${selectedContactToReport.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: repReason,
          description: repDescription,
          reportedBy: currentUserId,
          reporterEmail: repEmail
        })
      });

      const data = await res.json();
      if (res.ok) {
        setRepSuccessMsg("Discrepancy reported successfully. Administrators have queued this contact for verification testing.");
        setRepDescription("");
        fetchContacts();
        fetchAdminData();
      } else {
        setRepErrorMsg(data.error || "Failed to catalog error ticket.");
      }
    } catch (err) {
      setRepErrorMsg("Failed to connect to directory servers.");
    }
  };

  // ADMIN ACTION: Resolve Contributor submission entry draft
  const handleResolveSubmission = async (id: string, action: "Approve" | "Reject") => {
    try {
      const notes = adminNotesText[id] || "";
      const res = await fetch(`/api/admin/submissions/${id}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "Admin"
        },
        body: JSON.stringify({
          action,
          adminNotes: notes,
          adminId: currentUserId,
          adminEmail: currentUserEmail
        })
      });

      if (res.ok) {
        triggerNotification(`Submission request successfully ${action === "Approve" ? "Approved & elevated to live index!" : "Rejected."}`, "success");
        // Refetch contacts and admin data
        fetchContacts();
        fetchAdminData();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to make resolution decision.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ADMIN ACTION: Resolve discrepancy reports
  const handleResolveReport = async (reportId: string, action: "Reviewed" | "Resolved" | "DeleteContact") => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "Admin"
        },
        body: JSON.stringify({
          action,
          adminId: currentUserId,
          adminEmail: currentUserEmail
        })
      });

      if (res.ok) {
        triggerNotification(`Report ticket resolved successfully. Action taken: ${action}`, "success");
        fetchContacts();
        fetchAdminData();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to save reports resolution.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ADMIN ACTION: Direct edit existing live record fields
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editEvidence, setEditEvidence] = useState("");

  const startDirectEditing = (c: EmergencyContact) => {
    setEditingContactId(c.id);
    setEditName(c.serviceName);
    setEditPhone(c.phoneNumber);
    setEditDesc(c.description);
    setEditEvidence(c.verificationEvidence || "");
  };

  const handleSaveDirectEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/contacts/${id}/edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "Admin"
        },
        body: JSON.stringify({
          updatedFields: {
            serviceName: editName,
            phoneNumber: editPhone,
            description: editDesc,
            verificationEvidence: editEvidence
          },
          adminId: currentUserId,
          adminEmail: currentUserEmail
        })
      });

      if (res.ok) {
        triggerNotification("Live directory contact edited directly.", "success");
        setEditingContactId(null);
        fetchContacts();
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ADMIN ACTION: Directly harddelete contacts record
  const handleDirectDeleteContact = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this emergency contact record from India's live directories?")) return;
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "Admin"
        },
        body: JSON.stringify({
          adminId: currentUserId,
          adminEmail: currentUserEmail
        })
      });

      if (res.ok) {
        triggerNotification("Emergency contact permanently removed.", "info");
        fetchContacts();
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ADMIN ACTION: Create and publish a contact immediately to the master live directory
  const handleCreateDirectContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSuccessMsg("");
    setAdminErrorMsg("");

    if (!adminServiceName || !adminPhoneNumber || !adminOrganization || !adminDescription) {
      setAdminErrorMsg("All fields with an asterisk (*) are required.");
      return;
    }

    try {
      const res = await fetch("/api/admin/contacts", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-role": "Admin"
        },
        body: JSON.stringify({
          serviceName: adminServiceName,
          category: adminCategory,
          phoneNumber: adminPhoneNumber,
          state: adminState,
          district: adminDistrict,
          organization: adminOrganization,
          description: adminDescription,
          sourceUrl: adminSourceUrl,
          verificationEvidence: adminEvidence,
          adminId: currentUserId,
          adminEmail: currentUserEmail
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAdminSuccessMsg(`Successfully created emergency helpline "${adminServiceName}" immediately!`);
        setAdminServiceName("");
        setAdminPhoneNumber("");
        setAdminOrganization("");
        setAdminDescription("");
        setAdminSourceUrl("");
        setAdminEvidence("");
        
        fetchContacts();
        fetchAdminData();
        triggerNotification("Emergency helpline contact published directly.", "success");
      } else {
        setAdminErrorMsg(data.error || "Failed to create directory contact.");
      }
    } catch (err) {
      setAdminErrorMsg("System error: Could not contact emergency write service.");
    }
  };

  // Trigger default categories filter selection
  const categoriesList = Object.values(EmergencyCategory);

  return (
    <div className={`min-h-screen font-sans ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      
      {/* Floating global action notification toast */}
      {actionNotification && (
        <div 
          id="global-toast-notification"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border bg-slate-900/95 text-slate-100 border-sky-500 max-w-sm transition-all animate-bounce"
        >
          {actionNotification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-sky-400 shrink-0" />
          )}
          <span className="text-xs font-medium leading-relaxed">{actionNotification.message}</span>
        </div>
      )}

      {/* Main Navbar */}
      <nav id="app-top-navbar" className={`border-b ${isDark ? "bg-slate-950/80 border-slate-900" : "bg-white/80 border-slate-200"} sticky top-0 z-40 backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-orange-500 to-emerald-500 p-[2px]">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Phone className="w-5 h-5 text-orange-400 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 id="app-title-main" className={`text-sm md:text-base font-bold font-display tracking-tight flex items-center gap-1.5 ${isDark ? "text-white" : "text-slate-950"}`}>
                <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 bg-clip-text text-transparent">
                  INDIA
                </span>
                Emergency Resource Directory
              </h1>
              <p className={`text-[10px] leading-none ${isDark ? "text-slate-400" : "text-slate-600"}`}>Verified National Response Network</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-lg border cursor-pointer transition-colors ${isDark ? "border-slate-800 text-yellow-400 hover:bg-slate-900" : "border-slate-200 text-amber-600 hover:bg-slate-100"}`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Always visible dynamic submit contact button */}
            <button
              id="btn-trigger-submission"
              onClick={() => {
                setShowSubmissionModal(true);
              }}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition-all shadow-md shadow-sky-500/10"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Submit Contact</span>
            </button>

            {/* Dynamic Authenticated Role Indicator / Sign In Gateway */}
            {currentRole === "Guest" ? (
              <button
                id="btn-trigger-login-modal"
                onClick={() => {
                  setLoginError("");
                  setShowLoginModal(true);
                }}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition-all border border-slate-800"
              >
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span>Portal Sign In</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-200 leading-tight">{userName}</span>
                  <span className={`text-[10px] font-mono leading-none font-semibold ${currentRole === "Admin" ? "text-amber-500" : "text-sky-400"}`}>
                    {currentRole} Mode
                  </span>
                </div>
                <button
                  id="btn-trigger-signout"
                  onClick={() => {
                    setCurrentRole("Guest");
                    setCurrentUserEmail("guest@emergency.in");
                    setCurrentUserId("guest-session");
                    setUserName("Anonymous Guest");
                    triggerNotification("Signed out safely to Guest search mode.", "info");
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            )}

            {currentRole === "Admin" && (
              <a
                href="#admin-panel-anchor"
                className="flex items-center gap-1 text-xs bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-500 px-3 py-2 rounded-lg font-semibold transition"
              >
                <Shield className="w-3.5 h-3.5 animate-pulse" />
                <span className="hidden sm:inline">Console</span>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Banner Area */}
      <header className={`relative py-12 px-4 text-center overflow-hidden border-b ${isDark ? "bg-slate-950 border-slate-900" : "bg-gradient-to-b from-slate-100 to-slate-200 border-slate-300"}`}>
        {/* Subtle orange-green light flare overlay for design */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-3xl" />

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold uppercase tracking-wider mb-4 leading-none">
            <CheckCircle className="w-3.5 h-3.5" /> 100% Manually Audited Public Utility Helplines
          </div>
          
          <h2 className={`text-3xl md:text-5xl font-extrabold font-display tracking-tight mb-4 ${isDark ? "text-white" : "text-slate-950"}`}>
            Find Trusted Indian <br />
            <span className="bg-gradient-to-r from-orange-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent">
              Emergency Services Instantly
            </span>
          </h2>
          
          <p className={`text-sm md:text-base max-w-2xl mx-auto mb-8 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            A verified public utility index. Get direct, working contact phone numbers of ambulance centers, 
            state police networks, women's rescue desks, metal health hotlines, and animal rescue NGOs across India.
          </p>

          {/* Unified search parameters form card */}
          <div id="directory-search-component" className={`p-4 md:p-6 rounded-2xl shadow-xl max-w-3xl mx-auto border text-left ${isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"}`}>
            <h3 className="text-xs uppercase tracking-widest font-semibold text-sky-500 font-display mb-3 flex items-center gap-1.5">
              <Search className="w-4 h-4" /> Directory Quick Search Engine
            </h3>
            
            <div className="flex flex-col gap-4">
              {/* Query line input */}
              <div className="relative">
                <input
                  id="search-main-input-field"
                  type="text"
                  placeholder="Ask or search: Delhi NGO, Blood bank, 108 ambulance, state police..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none transition-all ${
                    isDark 
                      ? "bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500" 
                      : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"
                  }`}
                />
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                  <Search className="w-4.5 h-4.5" />
                </div>
              </div>

              {/* State and District interactive selection using child layout */}
              <StateDistrictSelector 
                selectedState={selectedState}
                selectedDistrict={selectedDistrict}
                onStateChange={setSelectedState}
                onDistrictChange={setSelectedDistrict}
                darkMode={isDark}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Categorized Filter bar */}
      <section className={`py-6 border-b ${isDark ? "bg-slate-950 border-slate-900" : "bg-slate-100 border-slate-200"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center group/scroller">
            
            {/* Left Scroll Button */}
            <button
              onClick={() => scrollCategories('left')}
              className={`absolute -left-3 z-10 p-2 rounded-full border shadow-lg transition-all cursor-pointer md:opacity-0 md:group-hover/scroller:opacity-100 md:group-focus-within/scroller:opacity-100 hover:scale-105 active:scale-95 ${
                isDark 
                  ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white focus:bg-slate-800" 
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 focus:bg-slate-50"
              }`}
              aria-label="Scroll category filters left"
              title="Scroll Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scrollable Container with category ref */}
            <div 
              ref={categoryScrollRef}
              className="flex-1 flex items-center gap-2 overflow-x-auto pb-3 px-2 select-none scroll-smooth scrollbar-thin"
              style={{ scrollBehavior: 'smooth' }}
            >
              <button
                id="category-filter-all"
                onClick={() => setSelectedCategory("All")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  selectedCategory === "All"
                    ? "bg-sky-600 text-white shadow-md shadow-sky-500/15"
                    : isDark ? "bg-slate-900 text-slate-400 hover:text-white" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                All Resource Types ({contacts.length})
              </button>
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  id={`category-filter-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                    selectedCategory === cat
                      ? "bg-sky-600 text-white shadow-md shadow-sky-500/15"
                      : isDark ? "bg-slate-900 text-slate-400 hover:text-white" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Right Scroll Button */}
            <button
              onClick={() => scrollCategories('right')}
              className={`absolute -right-3 z-10 p-2 rounded-full border shadow-lg transition-all cursor-pointer md:opacity-0 md:group-hover/scroller:opacity-100 md:group-focus-within/scroller:opacity-100 hover:scale-105 active:scale-95 ${
                isDark 
                  ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white focus:bg-slate-800" 
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 focus:bg-slate-50"
              }`}
              aria-label="Scroll category filters right"
              title="Scroll Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

          </div>
        </div>
      </section>

      {/* Main Grid content list */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Toggle options bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h3 className={`text-lg font-bold font-display tracking-tight flex items-center gap-2 ${isDark ? "text-white" : "text-slate-950"}`}>
              <Activity className="w-5 h-5 text-tomato text-orange-400" />
              {showBookmarksOnly ? "My Bookmarked Emergency Contacts" : "Direct Verified Emergency Helplines"}
            </h3>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              {showBookmarksOnly 
                ? `Filter active. Displaying ${bookmarkedIds.length} pinned resource listings.` 
                : `${contacts.length} audited contacts matched the active search filters.`
              }
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-toggle-bookmarks-only"
              onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                showBookmarksOnly 
                  ? "bg-sky-500/10 border-sky-500 text-sky-400" 
                  : isDark ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${showBookmarksOnly ? "fill-current" : ""}`} />
              {showBookmarksOnly ? "Show All Contacts" : `My Bookmarks (${bookmarkedIds.length})`}
            </button>
          </div>
        </div>

        {/* Directory List Stage container */}
        {isLoading ? (
          /* High quality skeleton loaders */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`border rounded-2xl p-6 space-y-4 animate-pulse ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="flex items-center justify-between">
                  <div className={`h-4 rounded w-1/3 ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
                  <div className={`h-4 rounded w-1/4 ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
                </div>
                <div className={`h-6 rounded w-3/4 ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
                <div className={`h-4 rounded w-full ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
                <div className="pt-4 flex gap-2">
                  <div className={`h-10 rounded w-1/2 ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
                  <div className={`h-10 rounded w-1/2 ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Filter live database.json list output */}
            {(() => {
              const displayed = showBookmarksOnly 
                ? contacts.filter(c => bookmarkedIds.includes(c.id)) 
                : contacts;

              if (displayed.length === 0) {
                return (
                  <div className={`text-center py-16 rounded-2xl border border-dashed px-4 ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-white/40 border-slate-300"}`}>
                    <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className={`text-base font-bold mb-1 font-display ${isDark ? "text-white" : "text-slate-950"}`}>No Verified Resource Listing Found</h3>
                    <p className={`text-xs max-w-md mx-auto mb-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      We didn't find any verified listings matching categories or locations. You can try adjusting filters or expand your query state scope.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCategory("All");
                        setSelectedState("All");
                        setSelectedDistrict("All");
                        setSearchQuery("");
                        setShowBookmarksOnly(false);
                      }}
                      className={`px-4 py-2 border rounded-lg text-xs font-semibold transition cursor-pointer ${isDark ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-white" : "bg-white border-slate-300 hover:bg-slate-50 text-slate-800 shadow-sm"}`}
                    >
                      Clear Search Parameters
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayed.map((contact) => {
                    const isBookmarked = bookmarkedIds.includes(contact.id);
                    const isEditing = editingContactId === contact.id;

                    return (
                      <div
                        key={contact.id}
                        id={`contact-card-${contact.id}`}
                        onClick={() => setSelectedContactToView(contact)}
                        className={`group relative rounded-2xl border transition-all hover:translate-y-[-2px] hover:shadow-xl cursor-pointer p-5 flex flex-col justify-between ${
                          isDark 
                            ? "bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-100 shadow-lg shadow-black/20" 
                            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-slate-100 text-slate-950 shadow-md"
                        }`}
                      >
                        {/* Upper Row */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3.5">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-450 border border-sky-500/20">
                              {contact.category}
                            </span>
                            
                            <div className="flex items-center gap-1">
                              <button
                                title="Pin to quick bookmarks list"
                                onClick={(e) => handleToggleBookmark(contact.id, e)}
                                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                  isBookmarked 
                                    ? "bg-yellow-500/10 border-yellow-500/40 text-yellow-500" 
                                    : isDark 
                                      ? "border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-white" 
                                      : "border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                }`}
                              >
                                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-current" : ""}`} />
                              </button>
                              
                              <button
                                title="Copy and prepare share message"
                                onClick={(e) => handleShareContact(contact, e)}
                                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                  isDark 
                                    ? "border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-white" 
                                    : "border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                }`}
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Direct Administrative update block inline */}
                          {isEditing ? (
                            <div className={`space-y-3 p-3 rounded-xl border ${isDark ? "bg-slate-950 border-amber-500/30 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} onClick={(e) => e.stopPropagation()}>
                              <div>
                                <label className="text-[10px] text-amber-500 font-bold block mb-0.5">Service Title Name</label>
                                <input 
                                  value={editName} 
                                  onChange={e => setEditName(e.target.value)} 
                                  className={`w-full text-xs p-1.5 rounded border outline-none ${isDark ? "bg-slate-900 border-slate-800 text-white focus:border-amber-500" : "bg-white border-slate-300 text-slate-900 focus:border-amber-500"}`}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-amber-500 font-bold block mb-0.5">Phone Connection</label>
                                <input 
                                  value={editPhone} 
                                  onChange={e => setEditPhone(e.target.value)} 
                                  className={`w-full text-xs p-1.5 rounded border outline-none ${isDark ? "bg-slate-900 border-slate-800 text-white focus:border-amber-500" : "bg-white border-slate-300 text-slate-900 focus:border-amber-500"}`}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-amber-500 font-bold block mb-0.5">Description Details</label>
                                <textarea 
                                  value={editDesc} 
                                  onChange={e => setEditDesc(e.target.value)} 
                                  className={`w-full text-xs p-1.5 rounded border outline-none font-mono ${isDark ? "bg-slate-900 border-slate-800 text-white focus:border-amber-500" : "bg-white border-slate-300 text-slate-900 focus:border-amber-500"}`}
                                />
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button 
                                  onClick={() => handleSaveDirectEdit(contact.id)}
                                  className="bg-emerald-600 hover:bg-emerald-500 py-1 px-2.5 rounded-lg text-[10px] font-bold text-white cursor-pointer transition"
                                >
                                  Save Change
                                </button>
                                <button 
                                  onClick={() => setEditingContactId(null)}
                                  className={`py-1 px-2.5 rounded-lg text-[10px] font-bold cursor-pointer transition ${isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-200 hover:bg-slate-300 text-slate-700"}`}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <h4 className="text-base font-bold font-display leading-tight mb-1 group-hover:text-sky-500 transition-colors">
                                {contact.serviceName}
                              </h4>
                              
                              <p className={`text-xs mb-3 font-medium flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                <Building className="w-3.5 h-3.5 inline text-sky-500 shrink-0" />
                                {contact.organization}
                              </p>

                              <p className={`text-xs line-clamp-2 md:line-clamp-3 mb-4 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600 font-medium"}`}>
                                {contact.description}
                              </p>
                            </>
                          )}

                          {/* State metadata label line */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md ${isDark ? "text-slate-400 bg-slate-800/40" : "text-slate-600 bg-slate-100"}`}>
                              <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                              {contact.state} {contact.district !== "All" && contact.district !== "All Districts" ? ` - ${contact.district}` : ""}
                            </span>
                            
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                              <Check className="w-3 h-3 shrink-0" /> Verified
                            </span>
                          </div>
                        </div>

                        {/* Bottom Row Actions */}
                        <div>
                          <div className={`border-t pt-3.5 mb-3 flex items-center justify-between text-[11px] ${isDark ? "border-slate-805 text-slate-400" : "border-slate-100 text-slate-500"}`}>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              Checked {contact.lastVerifiedDate}
                            </span>
                            <span className="font-mono">Views: {contact.viewCount}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                            {/* Connect directly */}
                            <a
                              id={`call-button-${contact.id}`}
                              href={`tel:${contact.phoneNumber}`}
                              title={`One-tap instant connection for ${contact.phoneNumber}`}
                              className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer transition shadow-md shadow-emerald-990/10"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              Call {contact.phoneNumber}
                            </a>

                            <button
                              id={`copy-number-btn-${contact.id}`}
                              onClick={(e) => handleCopyNumber(contact, e)}
                              className={`flex items-center justify-center gap-1.5 border text-xs font-bold py-2.5 rounded-xl cursor-pointer transition ${
                                isDark 
                                  ? "border-slate-800 hover:bg-slate-850 text-slate-200" 
                                  : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 shadow-sm"
                              }`}
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              Copy
                            </button>
                          </div>

                          {/* Guest error ticket interface */}
                          <div className="mt-3.5 flex items-center justify-between text-xs" onClick={(e) => e.stopPropagation()}>
                            <button
                              id={`report-issue-btn-${contact.id}`}
                              onClick={() => {
                                setSelectedContactToReport(contact);
                                setRepSuccessMsg("");
                                setRepErrorMsg("");
                                setRepEmail("");
                                setRepDescription("");
                                setShowReportModal(true);
                              }}
                              className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              Report bad phone or info
                            </button>

                            {/* Direct Admin in-line switches */}
                            {currentRole === "Admin" && (
                              <div className="flex items-center gap-1.5">
                                <button 
                                  onClick={() => startDirectEditing(contact)}
                                  className="text-[10px] text-amber-400 hover:underline font-bold"
                                >
                                  Edit Direct
                                </button>
                                <span className="text-slate-600">|</span>
                                <button 
                                  onClick={() => handleDirectDeleteContact(contact.id)}
                                  className="text-[10px] text-rose-500 hover:underline font-semibold"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </>
        )}
      </main>

      {/* Structured data section & Trust Guideline Banner */}
      <section className={`py-12 border-t ${isDark ? "bg-slate-900/50 border-slate-900" : "bg-white border-slate-200"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Accuracy & Integrity</span>
              <h3 className={`text-2xl font-bold font-display mt-2 mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>How our verification process works</h3>
              <p className={`text-xs md:text-sm leading-relaxed mb-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Unlike unmoderated platforms, our resources directory doesn't rely automatically on raw computer scrapers.
                Every state line, district health bank, animal shelter, or roadside ambulance we catalog goes through direct credential verification.
              </p>
              <div className={`space-y-3.5 text-xs ${isDark ? "text-slate-300" : "text-slate-700 font-medium"}`}>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Matching against official state government notifications (gazette releases, NIC portals).</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Manual randomized phone connection audits by regional directory moderators.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Verification logs detailing reference authority and timestamp, visible to the public.</span>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-2xl border space-y-4 shadow-inner ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <h4 className={`text-xs font-mono ${isDark ? "text-sky-400" : "text-sky-600 font-semibold"}`}>Active Technical Statistics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                  <span className={`block text-[10px] uppercase font-semibold ${isDark ? "text-slate-500 font-bold" : "text-slate-500 font-bold"}`}>National Backends</span>
                  <span className={`text-xl font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>Active</span>
                </div>
                <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                  <span className={`block text-[10px] uppercase font-semibold ${isDark ? "text-slate-500 font-bold" : "text-slate-500 font-bold"}`}>Verification Audit</span>
                  <span className="text-xl font-extrabold text-emerald-500">Pass</span>
                </div>
                <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                  <span className={`block text-[10px] uppercase font-semibold ${isDark ? "text-slate-500 font-bold" : "text-slate-500 font-bold"}`}>Standard Port</span>
                  <span className={`text-xl font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>Secure Red</span>
                </div>
                <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                  <span className={`block text-[10px] uppercase font-semibold ${isDark ? "text-slate-500 font-bold" : "text-slate-500 font-bold"}`}>Response Engine</span>
                  <span className={`text-xl font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>Under 2ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ADMIN CONSOLE ANCHOR BASE VIEW (Visually stunning interactive analytics, audits, resolving panels) */}
      {currentRole === "Admin" && (
        <section id="admin-panel-anchor" className={`border-t py-12 ${isDark ? "bg-slate-950 border-slate-900" : "bg-slate-50 border-slate-200"}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`flex items-center justify-between mb-8 pb-4 border-b ${isDark ? "border-slate-900" : "border-slate-200"}`}>
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                  <Shield className="w-5 h-5 text-tomato" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold font-display ${isDark ? "text-white" : "text-slate-950"}`}>Administrative Desk Overview</h3>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>Authorize submissions, resolve discrepancies, and inspect real-time audit pipelines.</p>
                </div>
              </div>

              <button
                onClick={fetchAdminData}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition duration-150 cursor-pointer ${
                  isDark 
                    ? "bg-slate-900 border-slate-800 hover:bg-slate-805 text-slate-300 hover:text-white" 
                    : "bg-white border-slate-300 hover:bg-slate-100 text-slate-700 shadow-sm"
                }`}
              >
                Refresh Board Data
              </button>
            </div>

            {/* Metric widgets row */}
            {analytics && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-900 border-slate-850" : "bg-white border-slate-200 shadow-sm"}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Total Resources</span>
                  <span className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>{analytics.totalContacts}</span>
                </div>
                <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-900 border-slate-850" : "bg-white border-slate-200 shadow-sm"}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Verified Base</span>
                  <span className="text-2xl font-extrabold text-emerald-500">{analytics.verifiedContacts}</span>
                </div>
                <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-900 border-slate-850" : "bg-white border-slate-200 shadow-sm"}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Pending Review</span>
                  <span className="text-2xl font-extrabold text-amber-500 animate-pulse">{analytics.pendingReviews}</span>
                </div>
                <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-900 border-slate-850" : "bg-white border-slate-200 shadow-sm"}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Issue Tickets</span>
                  <span className="text-2xl font-extrabold text-rose-500">{reports.filter(r => r.status === "Pending").length}</span>
                </div>
                <div className={`p-4 rounded-xl border col-span-2 md:col-span-1 ${isDark ? "bg-slate-900 border-slate-850" : "bg-white border-slate-200 shadow-sm"}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>My User Bookmarks</span>
                  <span className="text-2xl font-extrabold text-sky-400">{bookmarkedIds.length}</span>
                </div>
              </div>
            )}

            {/* Category distributions metrics with pure CSS micro-graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-850" : "bg-white border-slate-200 shadow-sm"}`}>
                <h4 className="text-xs uppercase tracking-widest text-sky-500 font-semibold mb-4 flex items-center gap-1.5 font-display">
                  <BarChart3 className="w-4 h-4" /> Category Distribution (Verified Live Contacts)
                </h4>
                {analytics && (
                  <div className="space-y-3.5">
                    {analytics.categoryDistribution.map((item) => {
                      const maxVal = Math.max(...analytics.categoryDistribution.map(c => c.count), 1);
                      const percentage = (item.count / maxVal) * 100;
                      return (
                        <div key={item.category} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold animate-fade-in">
                            <span className={isDark ? "text-slate-300" : "text-slate-700"}>{item.category}</span>
                            <span className={isDark ? "text-slate-400" : "text-slate-650"}>{item.count} items</span>
                          </div>
                          <div className={`w-full h-2.5 rounded-full overflow-hidden border ${isDark ? "bg-slate-950 border-slate-850" : "bg-slate-100 border-slate-200"}`}>
                            <div 
                              className="bg-sky-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Keyword/search insights */}
              <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-850" : "bg-white border-slate-200 shadow-sm"}`}>
                <h4 className="text-xs uppercase tracking-widest text-orange-500 font-semibold mb-4 flex items-center gap-1.5 font-display">
                  <Clock className="w-4 h-4" /> Live Search Keyword Trends
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analytics && analytics.searchTrends.map((trend, id) => (
                    <div key={id} className={`p-3 rounded-xl border flex justify-between items-center text-xs ${isDark ? "bg-slate-950 border-slate-900" : "bg-slate-50 border-slate-100"}`}>
                      <span className={`font-mono ${isDark ? "text-slate-300" : "text-slate-700 font-medium"}`}>"{trend.keyword}"</span>
                      <span className={`border font-bold px-2 py-0.5 rounded-md ${isDark ? "bg-indigo-950/40 text-indigo-455 border-indigo-900/60" : "bg-indigo-50 text-indigo-700 border-indigo-200"}`}>
                        {trend.count} calls
                      </span>
                    </div>
                  ))}
                  {(!analytics || analytics.searchTrends.length === 0) && (
                    <p className="text-xs text-slate-500 italic p-4">No search keywords logged yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* NEW SECTION: Citizen Suggested Helplines Verification Queue */}
            <div className={`mt-8 mb-10 p-6 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-850" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="flex items-center justify-between mb-4 border-b pb-3 border-dashed border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1 px-2.5 rounded bg-amber-500/10 text-amber-550 font-bold text-xs animate-pulse">
                    QUEUE
                  </div>
                  <h4 className="text-sm font-bold font-display uppercase tracking-wider text-amber-550">
                    Citizen Emergency Suggestions Review Pipeline ({submissions.filter(s => s.status === "Pending").length} pending)
                  </h4>
                </div>
              </div>

              {submissions.filter(s => s.status === "Pending").length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 italic">
                  🛡️ No pending helpline suggestions from citizens. The verification queue is currently fully clear.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {submissions.filter(s => s.status === "Pending").map((sub) => (
                    <div 
                      key={sub.id} 
                      className={`p-4 rounded-xl border text-xs flex flex-col justify-between ${
                        isDark ? "bg-slate-950 border-slate-850 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900 shadow-sm"
                      } animate-fade-in`}
                    >
                      <div>
                        {/* Title and Category */}
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <div>
                            <span className="block font-bold text-sm text-[13px] leading-snug">{sub.serviceName}</span>
                            <span className="text-[10px] text-sky-500 font-mono tracking-wider">{sub.category}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                            isDark ? "bg-amber-950/40 text-amber-500 border-amber-900/40" : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            Pending Review
                          </span>
                        </div>

                        {/* Contacts & Coverage Details */}
                        <div className="space-y-1 my-3 font-medium text-[11px]">
                          <p className="flex items-center gap-1">
                            <span className="text-slate-500 font-mono">Connection Num:</span> 
                            <strong className="text-emerald-500 font-bold">{sub.phoneNumber}</strong>
                          </p>
                          <p className="flex items-center gap-1">
                            <span className="text-slate-500">Organization:</span> <span>{sub.organization}</span>
                          </p>
                          <p className="flex items-center gap-1">
                            <span className="text-slate-500">Coverage Area:</span> 
                            <span className="font-bold text-sky-500">{sub.state} ({sub.district})</span>
                          </p>
                          <p className={`p-2 rounded-lg my-1.5 leading-relaxed font-sans ${isDark ? "bg-slate-900/30 text-slate-300" : "bg-white text-slate-700 border border-slate-100"}`}>
                            {sub.description}
                          </p>
                        </div>

                        {/* Source link Verification reference */}
                        <div className={`space-y-1 my-2.5 p-2 rounded-lg border ${isDark ? "bg-slate-900 border-slate-850" : "bg-white border-slate-150"}`}>
                          <p className="font-bold text-[9px] text-sky-500 uppercase tracking-wider">Verification Reference:</p>
                          <p className="text-[11px] truncate">
                            <span className="text-slate-500 font-bold">Source Link:</span>{" "}
                            <a 
                              href={sub.sourceUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-sky-400 font-bold hover:underline inline-flex items-center gap-0.5"
                            >
                              Check reference source <ExternalLink className="w-3 h-3 text-sky-400" />
                            </a>
                          </p>
                          {sub.verificationEvidence && (
                            <p className="text-[11px] leading-normal font-sans">
                              <span className="text-slate-500 font-bold">Evidence details:</span> <span className={isDark ? "text-slate-300" : "text-slate-700"}>{sub.verificationEvidence}</span>
                            </p>
                          )}
                        </div>

                        {/* Submitter Credentials */}
                        <div className={`p-2 rounded-lg text-[10px] font-mono ${isDark ? "bg-slate-900 text-teal-400" : "bg-teal-50 text-teal-700"}`}>
                          Suggested By: <span className="font-bold">{sub.submitterName || "Anonymous citizen"}</span> ({sub.submitterEmail || "guest@emergency.in"})
                        </div>
                      </div>

                      {/* Resolution controls */}
                      <div className="mt-4 pt-3 border-t border-dashed border-slate-800 space-y-3">
                        <div className="space-y-1">
                          <label className={`block text-[9px] uppercase font-bold text-slate-500`}>Resolution Memo / Staff Notes (Optional)</label>
                          <input
                            type="text"
                            placeholder="Reason for verification decision..."
                            value={adminNotesText[sub.id] || ""}
                            onChange={(e) => setAdminNotesText({ ...adminNotesText, [sub.id]: e.target.value })}
                            className={`w-full p-2 rounded-xl text-xs outline-none ${
                              isDark ? "bg-slate-900 border-slate-800 focus:border-amber-550 text-white" : "bg-white border-slate-200 focus:border-amber-550 text-slate-900"
                            }`}
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleResolveSubmission(sub.id, "Approve")}
                            className="flex-1 bg-emerald-605 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg transition text-[10px] cursor-pointer shadow-md shadow-emerald-500/10"
                          >
                            Approve & Publish Live
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResolveSubmission(sub.id, "Reject")}
                            className="bg-rose-900/10 text-rose-600 border border-rose-300 hover:bg-rose-900/20 font-semibold py-2 px-3 rounded-lg text-[10px] cursor-pointer transition"
                          >
                            Reject Proposal
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Direct submissions and Creation interface */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              {/* Admin Direct Creator Form Card */}
              <div className={`p-6 rounded-2xl border flex flex-col justify-between h-auto ${isDark ? "bg-slate-900 border-slate-850" : "bg-white border-slate-200 shadow-sm"}`}>
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-emerald-500 font-bold mb-4 flex items-center gap-1.5 font-display">
                    <PlusCircle className="w-4 h-4 text-emerald-500 font-bold animate-pulse" /> Create New Emergency Helpline Contact (Direct)
                  </h4>

                  <form onSubmit={handleCreateDirectContact} className="space-y-4 text-xs">
                    {adminSuccessMsg && (
                      <p className="p-3 bg-emerald-950/80 text-emerald-400 border border-emerald-900 rounded-xl font-medium leading-normal animate-bounce text-xs">
                        {adminSuccessMsg}
                      </p>
                    )}
                    {adminErrorMsg && (
                      <p className="p-3 bg-rose-950/80 text-rose-400 border border-rose-900 rounded-xl animate-bounce text-xs">
                        {adminErrorMsg}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`block mb-1 font-bold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Helpline / Service Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. National Trauma Helpline"
                          value={adminServiceName}
                          onChange={(e) => setAdminServiceName(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border outline-none focus:border-emerald-500 ${isDark ? "bg-slate-950 border-slate-805 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                          required
                        />
                      </div>
                      <div>
                        <label className={`block mb-1 font-bold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Connection Phone Number *</label>
                        <input
                          type="text"
                          placeholder="e.g. 108 or 011-23012113"
                          value={adminPhoneNumber}
                          onChange={(e) => setAdminPhoneNumber(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border outline-none focus:border-emerald-500 ${isDark ? "bg-slate-950 border-slate-805 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`block mb-1 font-bold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Category Class *</label>
                        <select
                          value={adminCategory}
                          onChange={(e) => setAdminCategory(e.target.value as EmergencyCategory)}
                          className={`w-full p-2.5 rounded-xl border outline-none focus:border-emerald-500 ${isDark ? "bg-slate-950 border-slate-805 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                        >
                          {categoriesList.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={`block mb-1 font-bold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Managing Organization / Agency *</label>
                        <input
                          type="text"
                          placeholder="e.g. Ministry of Health, GOI"
                          value={adminOrganization}
                          onChange={(e) => setAdminOrganization(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border outline-none focus:border-emerald-500 ${isDark ? "bg-slate-950 border-slate-805 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`block mb-1 font-bold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Operating State Coverage *</label>
                        <select
                          value={adminState}
                          onChange={(e) => {
                            const st = e.target.value;
                            setAdminState(st);
                            const districts = INDIA_STATES_AND_DISTRICTS[st];
                            if (districts && districts.length > 0) {
                              setAdminDistrict(districts[0]);
                            } else {
                              setAdminDistrict("All Districts");
                            }
                          }}
                          className={`w-full p-2.5 rounded-xl border outline-none focus:border-emerald-500 ${isDark ? "bg-slate-950 border-slate-805 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                        >
                          {Object.keys(INDIA_STATES_AND_DISTRICTS).map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={`block mb-1 font-bold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Operating District Coverage *</label>
                        <select
                          value={adminDistrict}
                          disabled={adminState === "National Coverage"}
                          onChange={(e) => setAdminDistrict(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border outline-none focus:border-emerald-500 disabled:opacity-40 ${isDark ? "bg-slate-950 border-slate-805 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                        >
                          {INDIA_STATES_AND_DISTRICTS[adminState]?.map((dst) => (
                            <option key={dst} value={dst}>{dst}</option>
                          )) || <option value="All Districts">All Districts</option>}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={`block mb-1 font-bold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Resource Service Description *</label>
                      <textarea
                        rows={2}
                        placeholder="Provide details about operational coverage hours, support languages, etc..."
                        value={adminDescription}
                        onChange={(e) => setAdminDescription(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border outline-none focus:border-emerald-500 ${isDark ? "bg-slate-950 border-slate-805 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`block mb-1 font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Official Source Link (URL)</label>
                        <input
                          type="url"
                          placeholder="https://mohfw.gov.in"
                          value={adminSourceUrl}
                          onChange={(e) => setAdminSourceUrl(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border outline-none focus:border-emerald-500 ${isDark ? "bg-slate-950 border-slate-805 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                        />
                      </div>
                      <div>
                        <label className={`block mb-1 font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Verification Evidence Reference</label>
                        <input
                          type="text"
                          placeholder="e.g. PIB Circular No. 43"
                          value={adminEvidence}
                          onChange={(e) => setAdminEvidence(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border outline-none focus:border-emerald-500 ${isDark ? "bg-slate-950 border-slate-805 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition shadow-lg shadow-emerald-990/10 cursor-pointer text-xs mt-3 block"
                    >
                      Publish Helpline Instantly
                    </button>
                  </form>
                </div>
              </div>

              {/* Direct user reported discrepancies */}
              <div className={`p-6 rounded-2xl border flex flex-col justify-between h-auto ${isDark ? "bg-slate-900 border-slate-850" : "bg-white border-slate-200 shadow-sm"}`}>
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-rose-500 font-semibold mb-4 flex items-center gap-1.5 font-display">
                    <AlertTriangle className="w-4 h-4" /> Discrepancy & Bad Phone Reports ({reports.filter(r => r.status === "Pending").length})
                  </h4>

                  <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                    {reports.length === 0 && (
                      <p className="text-xs text-slate-500 italic py-4">No working helpline issue reports cataloged.</p>
                    )}
                    {reports.map((rep) => (
                      <div key={rep.id} className={`p-4 rounded-xl border text-xs ${isDark ? "bg-slate-950 border-slate-900" : "bg-slate-50 border-slate-200 shadow-sm"}`}>
                        <div className="flex justify-between font-bold mb-2">
                          <span className="text-rose-500">{rep.reason}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] ${
                            rep.status === "Pending" ? "bg-amber-100/50 text-amber-800 border border-amber-200" : "bg-slate-100 text-slate-500"
                          }`}>{rep.status}</span>
                        </div>
                        
                        <div className="mb-2">
                          <span className={`block font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{rep.contactName}</span>
                          <span className={`font-mono text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>Number: {rep.contactNumber}</span>
                        </div>

                        <p className={`p-2.5 rounded-lg mb-3 leading-normal border ${isDark ? "text-slate-300 bg-slate-900 border-slate-850" : "bg-white border-slate-200 text-slate-700"}`}>
                          {rep.description}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2.5">
                          <span>Reporter: {rep.reporterEmail}</span>
                          <span>{rep.createdAt.slice(0, 10)}</span>
                        </div>

                        {rep.status === "Pending" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResolveReport(rep.id, "Resolved")}
                              className="flex-1 bg-sky-700 hover:bg-sky-600 text-white font-bold py-1.5 rounded-lg transition text-[10px] cursor-pointer"
                            >
                              Mark Handled & Keep
                            </button>
                            
                            <button
                              onClick={() => handleResolveReport(rep.id, "DeleteContact")}
                              className="bg-rose-900/10 text-rose-600 border border-rose-300 hover:bg-rose-900/20 font-semibold py-1.5 px-2.5 rounded-lg text-[10px] cursor-pointer transition"
                            >
                              Hard Delete Contact
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
              </div>
            </div>
          </div>

            {/* Audit Logs terminal-style view */}
            <div className={`mt-8 p-6 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-850" : "bg-white border-slate-200 shadow-sm"}`}>
              <h4 className={`text-xs uppercase tracking-widest font-semibold mb-4 flex items-center gap-1.5 font-display ${isDark ? "text-slate-450" : "text-slate-500"}`}>
                <Clock className="w-4 h-4" /> System Operation Audit Pipeline Trail (Last 10 Actions)
              </h4>
              <div className={`font-mono text-xs p-4 rounded-xl border space-y-2 max-h-[250px] overflow-y-auto ${isDark ? "bg-slate-950 border-slate-900 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-750"}`}>
                {auditLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className={`pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 border-b ${isDark ? "border-slate-900/80" : "border-slate-200"}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-sky-600 font-bold shrink-0">[{log.action}]</span>
                      <span className={isDark ? "text-slate-300" : "text-slate-800"}>{log.details}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 self-end sm:self-auto shrink-0 font-sans">
                      <span>{log.userEmail}</span> • <span>{log.timestamp.slice(11, 19)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className={`py-12 border-t ${isDark ? "bg-slate-950 border-slate-900" : "bg-slate-100 border-slate-300"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs md:text-sm text-slate-400 space-y-4">
          <p className={`font-display font-semibold ${isDark ? "text-slate-205" : "text-slate-800"}`}>
            India Emergency Resource Directory — Public Information Portal
          </p>
          <p className="max-w-2xl mx-auto text-xs text-slate-500 leading-normal font-sans">
            Disclaimer: Although our system monitors and reviews submitter references, any phone calling connection is subject 
            to standard telecommunications connectivity. In situations of absolute immediate high bodily danger, 
            always prioritize dialing the universal government direct lines <strong className="text-orange-500">112</strong> / <strong className="text-emerald-600 font-bold">100</strong> immediately.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs font-semibold flex-wrap">
            {/* <span className={isDark ? "text-slate-550" : "text-slate-600"}>Server Active: Port 3000 Mode</span> */}
            {/* <span className="text-slate-600">•</span> */}
            {/* <span className={isDark ? "text-slate-550" : "text-slate-600"}>Region Code: IN-99</span> */}
            {/* <span className="text-slate-600">•</span> */}
            {/* <span className={isDark ? "text-slate-550" : "text-slate-600"}>UTC Clock: 2026-06-05</span> */}
            <span className="text-slate-600">•</span>
            <button 
              onClick={() => {
                setLoginError("");
                setShowLoginModal(true);
              }} 
              className="text-sky-600 hover:text-sky-500 hover:underline cursor-pointer font-bold transition duration-150"
            >Security & Staff Login
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL: Submit Helpline Suggestion directly in UI */}
      {showSubmissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowSubmissionModal(false)}>
          <div 
            className={`border rounded-3xl p-6 w-full max-w-2xl text-left shadow-2xl relative max-h-[90vh] overflow-y-auto ${
              isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
            }`} 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowSubmissionModal(false)}
              className={`absolute top-4 right-4 p-1 rounded-full cursor-pointer ${isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-950 hover:bg-slate-100"}`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h3 className={`text-lg font-bold font-display ${isDark ? "text-white" : "text-slate-900"}`}>
                  Suggest an Emergency Helpline
                </h3>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Submit verified contact information for emergency support helplines. All entries must have an official reference source before System Admins approve and publish them to the directory.
              </p>
            </div>

            {subSuccessMsg && (
              <div className="p-4 mb-4 rounded-xl text-xs font-semibold bg-emerald-550/10 text-emerald-500 border border-emerald-500/20 animate-fade-in">
                {subSuccessMsg}
              </div>
            )}

            {subErrorMsg && (
              <div className="p-4 mb-4 rounded-xl text-xs font-semibold bg-rose-550/10 text-rose-500 border border-rose-500/20 animate-fade-in">
                {subErrorMsg}
              </div>
            )}

            <form onSubmit={handleNewSubmission} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Helpline Name */}
                <div className="space-y-1">
                  <label className="block font-bold">Helpline / Service Name <span className="text-red-550">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. National Cyber Crime Helpline"
                    value={subServiceName}
                    onChange={(e) => setSubServiceName(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? "bg-slate-950 border-slate-800 text-white focus:border-sky-500" : "bg-white border-slate-200 text-slate-900 focus:border-sky-500"
                    }`}
                  />
                </div>

                {/* Telephone Number */}
                <div className="space-y-1">
                  <label className="block font-bold">Helpline Number <span className="text-red-550">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1930 or 011-XXXXXXXX"
                    value={subPhoneNumber}
                    onChange={(e) => setSubPhoneNumber(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? "bg-slate-950 border-slate-800 text-white focus:border-sky-500" : "bg-white border-slate-200 text-slate-900 focus:border-sky-500"
                    }`}
                  />
                </div>

                {/* Category selection */}
                <div className="space-y-1">
                  <label className="block font-bold">In-Directory Category <span className="text-red-550">*</span></label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value as EmergencyCategory)}
                    className={`w-full p-2.5 rounded-xl border outline-none cursor-pointer ${
                      isDark ? "bg-slate-950 border-slate-800 focus:border-sky-500 text-slate-100" : "bg-white border-slate-200 focus:border-sky-500 text-slate-800"
                    }`}
                  >
                    {Object.values(EmergencyCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Organization Department */}
                <div className="space-y-1">
                  <label className="block font-bold">Managing Department / Agency <span className="text-red-550">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ministry of Home Affairs"
                    value={subOrganization}
                    onChange={(e) => setSubOrganization(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? "bg-slate-950 border-slate-800 text-white focus:border-sky-500" : "bg-white border-slate-200 text-slate-900 focus:border-sky-500"
                    }`}
                  />
                </div>
              </div>

              {/* State and District Selector inline inside submit */}
              <div className={`border border-dashed p-3 rounded-2xl col-span-2 space-y-1.5 ${isDark ? "bg-slate-950/20 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                <span className="font-bold text-[10px] text-sky-500 uppercase tracking-wider block">Coverage Territory</span>
                <StateDistrictSelector 
                  selectedState={subState}
                  selectedDistrict={subDistrict}
                  onStateChange={(state) => {
                    setSubState(state);
                    if (state === "All") {
                      setSubDistrict("All Districts");
                    }
                  }}
                  onDistrictChange={setSubDistrict}
                  darkMode={isDark}
                />
              </div>

              {/* Description / Mandate */}
              <div className="space-y-1">
                <label className="block font-bold">Resource Description & Instructions <span className="text-red-550">*</span></label>
                <textarea
                  required
                  rows={2}
                  placeholder="What is this helpline for? Specifying emergency timings, toll-free details, hours of accessibility..."
                  value={subDescription}
                  onChange={(e) => setSubDescription(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-none ${
                    isDark ? "bg-slate-950 border-slate-800 text-white focus:border-sky-500" : "bg-white border-slate-200 text-slate-900 focus:border-sky-500"
                  }`}
                />
              </div>

              {/* Official Source Link */}
              <div className="space-y-1">
                <label className="block font-bold">Official Reference Link (e.g. Govt PDF or Web Source) <span className="text-red-550">*</span></label>
                <input
                  type="url"
                  required
                  placeholder="e.g. https://cybercrime.gov.in/"
                  value={subSourceUrl}
                  onChange={(e) => setSubSourceUrl(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-none ${
                    isDark ? "bg-slate-950 border-slate-800 text-white focus:border-sky-500" : "bg-white border-slate-200 text-slate-900 focus:border-sky-500"
                  }`}
                />
              </div>

              {/* Evidence details Checked */}
              <div className="space-y-1">
                <label className="block font-bold">Verification Evidence / Extra Context (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Details of verification, e.g., 'Checked on Telecom Gazette or verified on government website link.'"
                  value={subEvidence}
                  onChange={(e) => setSubEvidence(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-none ${
                    isDark ? "bg-slate-950 border-slate-800 text-white focus:border-sky-500" : "bg-white border-slate-200 text-slate-900 focus:border-sky-500"
                  }`}
                />
              </div>

              {/* Optional Submitter Info */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t ${isDark ? "border-slate-805" : "border-slate-200"}`}>
                <div className="space-y-1">
                  <label className="block font-bold">Your Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="username"
                    value={subSubmitterName}
                    onChange={(e) => setSubSubmitterName(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? "bg-slate-950 border-slate-800 text-white focus:border-sky-500" : "bg-white border-slate-200 text-slate-900 focus:border-sky-500"
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Your Contact Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="user email (for follow-up if needed)"
                    value={subSubmitterEmail}
                    onChange={(e) => setSubSubmitterEmail(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? "bg-slate-950 border-slate-800 text-white focus:border-sky-500" : "bg-white border-slate-200 text-slate-900 focus:border-sky-500"
                    }`}
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowSubmissionModal(false)}
                  className={`px-4 py-2.5 rounded-xl font-semibold cursor-pointer text-xs transition duration-150 ${
                    isDark ? "bg-slate-800 hover:bg-slate-750 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer text-xs transition shadow-md shadow-sky-500/15"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUGGESTION SUCCESS POPUP (IN THE DEAD CENTER OF THE VIEWPORT) */}
      {subSuccessMsg && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" 
          onClick={() => setSubSuccessMsg("")}
        >
          <div 
            className={`border rounded-3xl p-6 sm:p-8 w-full max-w-sm text-center shadow-2xl relative ${
              isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
            }`} 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSubSuccessMsg("")}
              className={`absolute top-4 right-4 p-1 rounded-full cursor-pointer transition ${
                isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-950 hover:bg-slate-100"
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 animate-pulse">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>

            <h3 className={`text-base font-bold font-display mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              Suggested Successfully!
            </h3>
            
            <p className={`text-xs leading-relaxed mb-6 font-sans ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              {subSuccessMsg}
            </p>

            <button
              onClick={() => setSubSuccessMsg("")}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl cursor-pointer text-xs transition shadow-md shadow-sky-500/15"
            >
              Great, thank you!
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Report Misinformation / Incorrect Helpline */}
      {showReportModal && selectedContactToReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className={`border rounded-2xl p-6 w-full max-w-md text-left shadow-2xl relative ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-250"}`}>
            <div className={`flex items-center justify-between pb-3 border-b mb-4 animate-fade-in ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <h3 className="text-sm font-bold font-display flex items-center gap-1.5 text-rose-600">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Report Resource Issue
              </h3>
              <button 
                onClick={() => {
                  setSelectedContactToReport(null);
                  setShowReportModal(false);
                }}
                className={`p-1 rounded-full cursor-pointer ${isDark ? "text-slate-400 hover:text-white hover:bg-slate-850" : "text-slate-550 hover:text-slate-900 hover:bg-slate-100"}`}
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {repSuccessMsg ? (
              <div className="bg-emerald-950 text-emerald-400 p-4 border border-emerald-900 rounded-xl text-xs space-y-3">
                <p className="font-semibold">{repSuccessMsg}</p>
                <button
                  onClick={() => {
                    setSelectedContactToReport(null);
                    setShowReportModal(false);
                  }}
                  className="w-full py-2 bg-slate-800 text-white rounded-lg font-bold"
                >
                  Close Modal Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleNewReport} className="space-y-4 text-xs">
                <div>
                  <span className="block text-slate-500 text-[10px] uppercase font-bold">Target Resource Category</span>
                  <span className={`font-bold font-display text-sm block ${isDark ? "text-slate-100" : "text-slate-900"}`}>{selectedContactToReport.serviceName}</span>
                  <span className={`font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}>Current Phone Connection: {selectedContactToReport.phoneNumber}</span>
                </div>

                <div>
                  <label className={`block mb-1 font-bold ${isDark ? "text-slate-405" : "text-slate-700"}`}>Discrepancy Severity Reason *</label>
                  <select
                    value={repReason}
                    onChange={e => setRepReason(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border outline-none ${isDark ? "bg-slate-950 border-slate-800 text-white focus:ring-1 focus:ring-rose-500" : "bg-white border-slate-200 text-slate-900"}`}
                  >
                    <option value="Wrong number">Wrong Number / Typo in Connection</option>
                    <option value="Number not working">Non-responsive / Not Working Line</option>
                    <option value="Service unavailable">Emergency Center Inactive / Non-operational</option>
                    <option value="Duplicate entry">Duplicate Helpline Record</option>
                    <option value="Fake information">Fake Information / Unverified Authority</option>
                    <option value="Other">Other Discrepancies</option>
                  </select>
                </div>

                <div>
                  <label className={`block mb-1 font-bold ${isDark ? "text-slate-405" : "text-slate-700"}`}>Your Verification Email *</label>
                  <input
                    type="email"
                    placeholder="e.g. resident@citizens.in"
                    value={repEmail}
                    onChange={e => setRepEmail(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border outline-none ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                    required
                  />
                </div>

                <div>
                  <label className={`block mb-1 font-bold ${isDark ? "text-slate-405" : "text-slate-700"}`}>Discrepancy Details & Proof *</label>
                  <textarea
                    rows={3}
                    placeholder="Provide additional details regarding offline calling feedback, alternative lines..."
                    value={repDescription}
                    onChange={e => setRepDescription(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border outline-none ${isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                    required
                  />
                </div>

                {repErrorMsg && (
                  <p className="p-2 bg-rose-955 text-rose-450 border border-rose-900/60 rounded-lg text-[11px] font-medium">{repErrorMsg}</p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-xl transition cursor-pointer"
                  >
                    File Discrepancy Ticket
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedContactToReport(null);
                      setShowReportModal(false);
                    }}
                    className={`px-4 rounded-xl cursor-pointer ${isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-750" : "bg-slate-100 text-slate-700 hover:bg-slate-250"}`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Full Verified Contact Specification View */}
      {selectedContactToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedContactToView(null)}>
          <div className={`border rounded-3xl p-6 w-full max-w-lg text-left shadow-2xl relative ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} onClick={(e) => e.stopPropagation()}>
            
            <button 
              onClick={() => setSelectedContactToView(null)}
              className={`absolute top-4 right-4 p-1 rounded-full cursor-pointer ${isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-550 hover:text-slate-950 hover:bg-slate-100"}`}
            >
              <X className="w-5 h-5" />
            </button>

            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-500 border border-sky-550/20 mb-3 animate-pulse">
              {selectedContactToView.category}
            </span>

            <h3 className={`text-lg md:text-xl font-bold font-display mb-1.5 leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              {selectedContactToView.serviceName}
            </h3>

            <p className="text-xs text-sky-600 font-medium flex items-center gap-1.5 mb-4 font-semibold">
              <Building className="w-4 h-4 text-sky-600" />
              {selectedContactToView.organization}
            </p>

            <div className={`p-4 rounded-2xl border mb-4 space-y-2 ${isDark ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"}`}>
              <span className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? "text-slate-450" : "text-slate-500"}`}>Description & Mandate</span>
              <p className={`text-xs leading-relaxed font-sans ${isDark ? "text-slate-300" : "text-slate-700"}`}>{selectedContactToView.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className={`p-3 rounded-xl border text-xs ${isDark ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"}`}>
                <span className="block text-[9px] text-slate-500 uppercase font-bold">Region Coverage</span>
                <span className={`mt-0.5 block font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{selectedContactToView.state}</span>
              </div>
              <div className={`p-3 rounded-xl border text-xs ${isDark ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"}`}>
                <span className="block text-[9px] text-slate-500 uppercase font-bold">District Limit</span>
                <span className={`mt-0.5 block font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{selectedContactToView.district}</span>
              </div>
            </div>

            {/* Verification credentialing facts */}
            <div className={`p-4 rounded-2xl border mb-6 text-xs space-y-1.5 ${isDark ? "bg-emerald-950/20 border-emerald-500/20" : "bg-emerald-50 border-emerald-200 shadow-sm"}`}>
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold mb-1">
                <CheckCircle className="w-4 h-4" /> Official Verification Fact-Check
              </div>
              <p className={`text-[11px] leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                <strong>Source:</strong> <a href={selectedContactToView.sourceUrl} target="_blank" className="text-sky-600 underline inline-flex items-center gap-0.5">{selectedContactToView.sourceUrl.slice(0, 48)}... <ExternalLink className="w-3 h-3 text-sky-600" /></a>
              </p>
              <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                <strong>Evidence Checked:</strong> {selectedContactToView.verificationEvidence || "Approved government service registration databases."}
              </p>
              <p className={`text-[10px] font-mono pt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                Last Integrity & Operability: {selectedContactToView.lastVerifiedDate}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href={`tel:${selectedContactToView.phoneNumber}`}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-2xl cursor-pointer transition text-xs shadow-md shadow-emerald-500/10"
              >
                <Phone className="w-4 h-4" /> Call {selectedContactToView.phoneNumber}
              </a>
              <button
                onClick={(e) => {
                  handleCopyNumber(selectedContactToView, e);
                  setSelectedContactToView(null);
                }}
                className={`py-3 rounded-2xl font-semibold text-xs cursor-pointer transition ${isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-750" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                Copy Connection
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: ADMINISTRATIVE SECURITY ACCESS POINT */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowLoginModal(false)}>
          <div className={`border rounded-3xl p-6 w-full max-w-sm text-left shadow-2xl relative ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => {
                setShowLoginModal(false);
              }}
              className={`absolute top-4 right-4 p-1 rounded-full cursor-pointer ${isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-550 hover:text-slate-950 hover:bg-slate-100"}`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-550">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-bold font-display ${isDark ? "text-white" : "text-slate-900"}`}>
                  System Administrative Desk
                </h3>
                <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500 font-medium"}`}>
                  Restricted access control authentication gate
                </p>
              </div>
            </div>

            {loginError && (
              <p className={`p-2.5 mb-4 border rounded-xl text-xs font-semibold ${
                isDark 
                  ? "bg-rose-950/40 border-rose-900 text-rose-450 text-rose-400" 
                  : "bg-rose-50 border-rose-220 text-rose-700"
              }`}>
                {loginError}
              </p>
            )}

            <form onSubmit={handleCustomLogin} className="space-y-4 text-xs font-sans">
              <p className={`leading-normal mb-1 font-sans ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Only authorized administrative officers can authenticate here using the variables defined in standard system secrets.
              </p>

              <div className="space-y-3">
                <div>
                  <label className={`block mb-1 font-bold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Admin Username</label>
                  <input
                    type="text"
                    placeholder="e.g. admin@emergency.in"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border outline-none ${isDark ? "bg-slate-950 border-slate-800 text-white focus:border-amber-500" : "bg-white border-slate-200 text-slate-900 focus:border-amber-500"}`}
                    required
                  />
                </div>

                <div>
                  <label className={`block mb-1 font-bold ${isDark ? "text-slate-440" : "text-slate-700"}`}>Admin Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border outline-none ${isDark ? "bg-slate-950 border-slate-800 text-white focus:border-amber-500" : "bg-white border-slate-200 text-slate-900 focus:border-amber-500"}`}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl transition cursor-pointer text-xs mt-4 block shadow-md shadow-amber-600/10"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
