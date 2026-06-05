/**
 * India Emergency Resource Directory - Shared TypeScript Definitions
 */

export enum EmergencyCategory {
  POLICE = "Police",
  AMBULANCE = "Ambulance",
  FIRE = "Fire",
  WOMEN_HELPLINE = "Women Helpline",
  CHILD_HELPLINE = "Child Helpline",
  DISASTER_MANAGEMENT = "Disaster Management",
  BLOOD_BANK = "Blood Bank",
  MENTAL_HEALTH = "Mental Health",
  ANIMAL_RESCUE = "Animal Rescue",
  ROADSIDE_ASSISTANCE = "Roadside Assistance",
  NGO_SUPPORT = "NGO Support"
}

export type VerificationStatus = "Verified" | "Pending Review" | "Rejected";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "Guest" | "Registered" | "Admin";
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  serviceName: string;
  category: EmergencyCategory;
  phoneNumber: string;
  state: string; // "National" or State Name
  district: string; // "All" or District Name
  organization: string;
  description: string;
  sourceUrl: string;
  verificationStatus: VerificationStatus;
  lastVerifiedDate: string;
  verificationEvidence?: string;
  viewCount: number;
  reportCount: number;
  submittedBy?: string; // User ID if applicable
}

export interface ContactSubmission {
  id: string;
  serviceName: string;
  category: EmergencyCategory;
  phoneNumber: string;
  state: string;
  district: string;
  organization: string;
  description: string;
  sourceUrl: string;
  verificationEvidence: string;
  status: "Pending" | "Approved" | "Rejected";
  submittedBy: string;
  submitterEmail: string;
  submitterName: string;
  createdAt: string;
  adminNotes?: string;
}

export interface ContactReport {
  id: string;
  contactId: string;
  contactName: string;
  contactNumber: string;
  reason: "Wrong number" | "Number not working" | "Service unavailable" | "Duplicate entry" | "Fake information" | "Other";
  description: string;
  status: "Pending" | "Reviewed" | "Resolved";
  reportedBy: string;
  reporterEmail: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface AnalyticsSummary {
  totalContacts: number;
  verifiedContacts: number;
  pendingReviews: number;
  rejectedContacts: number;
  reportsSubmitted: number;
  categoryDistribution: { category: string; count: number }[];
  searchTrends: { keyword: string; count: number }[];
  mostSearchedCategories: { category: string; count: number }[];
  mostViewedContacts: EmergencyContact[];
  mostReportedContacts: EmergencyContact[];
}

// Structured State - District list for accurate drop-downs
export const INDIA_STATES_AND_DISTRICTS: { [state: string]: string[] } = {
  "National Coverage": ["All Districts"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati", "Anantapur", "Kakinada", "Kadapa"],
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Changlang", "Ziro", "Pasighat", "Bomdila"],
  "Assam": ["Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Nagaon", "Tezpur", "Tinsukia"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Ara", "Begusarai"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Rajnandgaon", "Jagdalpur"],
  "Delhi NCR": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Central Delhi", "Dwarka", "Rohini"],
  "Goa": ["North Goa (Panaji)", "South Goa (Margao)", "Vasco da Gama", "Mapusa"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Anand", "Junagadh"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Panchkula"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi", "Kullu", "Manali", "Hamirpur", "Bilaspur"],
  "Jammu & Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Kathua", "Udhampur", "Samba"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh", "Giridih"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi-Dharwad", "Belagavi", "Udupi", "Shivamogga", "Tumakuru"],
  "Kerala": ["Trivandrum", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Alappuzha", "Palakkad", "Kannur", "Kottayam"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Amravati", "Kolhapur", "Navi Mumbai"],
  "Manipur": ["Imphal", "Thoubal", "Churachandpur", "Ukhrul", "Senapati"],
  "Meghalaya": ["Shillong", "Tura", "Jowai", "Nongpoh", "Cherrapunji"],
  "Mizoram": ["Aizawl", "Lunglei", "Champhai", "Saiha"],
  "Nagaland": ["Dimapur", "Kohima", "Mokokchung", "Tuensang", "Wokha"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Bhadrak"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Hoshiarpur"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Udaipur", "Bikaner", "Ajmer", "Bhilwara", "Alwar", "Sikar"],
  "Sikkim": ["Gangtok", "Namchi", "Geyzing", "Mangan"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", "Tirunelveli", "Vellore", "Erode", "Thanjavur"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam", "Mahabubnagar"],
  "Tripura": ["Agartala", "Udaipur", "Dharmanagar", "Kailasahar"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Meerut", "Varanasi", "Allahabad-Prayagraj", "Noida", "Bareilly", "Aligarh", "Gorakhpur"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Haldwani-Kathgodam", "Roorkee", "Rishikesh", "Nainital", "Mussoorie"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri", "Asansol", "Durgapur", "Kharagpur", "Bardhaman", "Malda"]
};
