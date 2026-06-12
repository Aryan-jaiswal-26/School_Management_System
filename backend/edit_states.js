import fs from 'fs';

const filePath = 'c:/Users/ASUS/Desktop/school-management-system-2-master/src/routes/admin.hostel.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const replacement = `  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // States for all modules
  const [floors, setFloors] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [feePlans, setFeePlans] = useState<any[]>([]);
  const [feeInvoices, setFeeInvoices] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({
    totalHostels: 0,
    totalFloors: 0,
    totalRooms: 0,
    totalBeds: 0,
    occupiedBeds: 0,
    availableBeds: 0,
    occupancyPct: 0,
    openComplaints: 0,
    pendingFees: 0,
    totalCollected: 0
  });

  const [showAllotmentModal, setShowAllotmentModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showWardenMsgModal, setShowWardenMsgModal] = useState(false);

  // Allotment Select Filters
  const [selectedAllotmentHostelId, setSelectedAllotmentHostelId] = useState<string>("");
  const [selectedAllotmentFloorId, setSelectedAllotmentFloorId] = useState<string>("");
  const [selectedAllotmentRoomId, setSelectedAllotmentRoomId] = useState<string>("");
  const [selectedAllotmentClass, setSelectedAllotmentClass] = useState<string>("");
  const [selectedAllotmentDiv, setSelectedAllotmentDiv] = useState<string>("");

  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceSession, setAttendanceSession] = useState<"morning" | "evening" | "night">("evening");
  const [presentBeds, setPresentBeds] = useState<Record<string, boolean>>({});

  // Filter terms
  const [studentSearch, setStudentSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        hRes,
        flRes,
        rRes,
        bRes,
        alRes,
        sRes,
        cRes,
        vRes,
        lRes,
        atRes,
        nRes,
        fpRes,
        fiRes,
        mRes,
        anRes
      ] = await Promise.all([
        apiClient<any>("/hostel"),
        apiClient<any>("/hostel/structure?entity=floors").catch(() => ({ data: [] })),`;

// We will find const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
// and replace it and everything up to structure?entity=floors
const matchStr = 'const [selectedInvoice, setSelectedInvoice] = useState<any>(null);';
const idxStart = content.indexOf(matchStr);
const idxEnd = content.indexOf('apiClient<any>("/hostel/structure?entity=floors").catch(() => ({ data: [] })),');

if (idxStart !== -1 && idxEnd !== -1) {
  content = content.substring(0, idxStart) + replacement + content.substring(idxEnd + 'apiClient<any>("/hostel/structure?entity=floors").catch(() => ({ data: [] })),'.length);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Replaced successfully using indices!");
} else {
  console.log("Indices not found! Start:", idxStart, "End:", idxEnd);
}
