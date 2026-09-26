// =============================================================================
// आदेश ग्रुप, मलफा (श्री गणेश उत्सव मंडळ) - सभासद नोंदणी व डिजिटल प्रमाणपत्र प्रणाली
// Full-Stack Single Page Application with Firebase v9+ & html2canvas
// =============================================================================

// Import Firebase Web SDK v9+ (Modular ES Modules from official CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// =============================================================================
// 1. FIREBASE CONFIGURATION KEYS
// Paste your Firebase Project credentials below:
// =============================================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// =============================================================================
// 2. INITIALIZATION & SMART ENVIRONMENT DETECTION
// Checks if real Firebase keys are provided or enables local simulation mode
// =============================================================================
let db = null;
let storage = null;
let isFirebaseLive = false;

const isConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_API_KEY" && 
  firebaseConfig.projectId !== "YOUR_PROJECT_ID";

if (isConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    isFirebaseLive = true;
    console.log("✅ Firebase v9+ connected successfully to Firestore & Storage!");
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
  }
} else {
  console.info("ℹ️ Running in Demo/Offline Mode with Local Storage. Replace firebaseConfig keys with your Firebase project credentials for live production.");
  const noticeBanner = document.getElementById("demoNoticeBanner");
  if (noticeBanner) noticeBanner.classList.remove("hidden");
}

// Local mock storage for immediate testing before keys are pasted
const LOCAL_STORAGE_KEY = "agm_members_records";
function getLocalMembers() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
  } catch (e) {
    return [];
  }
}
function saveLocalMember(member) {
  const members = getLocalMembers();
  members.push(member);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(members));
}

// =============================================================================
// 3. DOM ELEMENTS
// =============================================================================
const tabRegisterBtn = document.getElementById("tabRegisterBtn");
const tabSearchBtn = document.getElementById("tabSearchBtn");
const registrationSection = document.getElementById("registrationSection");
const searchSection = document.getElementById("searchSection");

const membershipForm = document.getElementById("membershipForm");
const fullNameInput = document.getElementById("fullName");
const mobileInput = document.getElementById("mobileNumber");
const photoInput = document.getElementById("photoInput");
const uploadDropArea = document.getElementById("uploadDropArea");
const uploadPrompt = document.getElementById("uploadPrompt");
const photoPreviewContainer = document.getElementById("photoPreviewContainer");
const photoPreviewImg = document.getElementById("photoPreviewImg");
const photoName = document.getElementById("photoName");
const photoSize = document.getElementById("photoSize");
const removePhotoBtn = document.getElementById("removePhotoBtn");

const nameError = document.getElementById("nameError");
const mobileError = document.getElementById("mobileError");
const photoError = document.getElementById("photoError");
const submitBtn = document.getElementById("submitBtn");
const btnText = document.getElementById("btnText");
const btnSpinner = document.getElementById("btnSpinner");

const duplicateModal = document.getElementById("duplicateModal");
const closeDuplicateModalBtn = document.getElementById("closeDuplicateModalBtn");
const duplicateViewBtn = document.getElementById("duplicateViewBtn");

const successCard = document.getElementById("successCard");
const viewCertificateBtn = document.getElementById("viewCertificateBtn");
const shareWhatsAppBtn = document.getElementById("shareWhatsAppBtn");

const certificateModal = document.getElementById("certificateModal");
const closeCertModalBtn = document.getElementById("closeCertModalBtn");
const certPreviewOutput = document.getElementById("certPreviewOutput");
const downloadAgainBtn = document.getElementById("downloadAgainBtn");
const modalShareBtn = document.getElementById("modalShareBtn");

// Certificate Template Elements
const hdCertificateTemplate = document.getElementById("hdCertificateTemplate");
const certMemberName = document.getElementById("certMemberName");
const certMemberId = document.getElementById("certMemberId");
const certMemberMobile = document.getElementById("certMemberMobile");
const certMemberDate = document.getElementById("certMemberDate");
const certMemberPhoto = document.getElementById("certMemberPhoto");

// Search Form Elements
const searchForm = document.getElementById("searchForm");
const searchMobile = document.getElementById("searchMobile");
const searchError = document.getElementById("searchError");
const searchSubmitBtn = document.getElementById("searchSubmitBtn");
const searchBtnText = document.getElementById("searchBtnText");
const searchBtnSpinner = document.getElementById("searchBtnSpinner");

// State
let selectedFile = null;
let currentImageDataUrl = "";
let lastGeneratedMember = null;
let duplicateFoundRecord = null;

// =============================================================================
// 4. UI TAB NAVIGATION
// =============================================================================
tabRegisterBtn.addEventListener("click", () => {
  tabRegisterBtn.className = "py-2.5 px-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-sm";
  tabSearchBtn.className = "py-2.5 px-3 rounded-xl font-semibold text-sm text-gray-600 hover:text-orange-600 transition-all duration-200 flex items-center justify-center gap-2";
  registrationSection.classList.remove("hidden");
  searchSection.classList.add("hidden");
});

tabSearchBtn.addEventListener("click", () => {
  tabSearchBtn.className = "py-2.5 px-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-sm";
  tabRegisterBtn.className = "py-2.5 px-3 rounded-xl font-semibold text-sm text-gray-600 hover:text-orange-600 transition-all duration-200 flex items-center justify-center gap-2";
  searchSection.classList.remove("hidden");
  registrationSection.classList.add("hidden");
});

// =============================================================================
// 5. PHOTO UPLOAD & PREVIEW LOGIC
// =============================================================================
photoInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  handlePhotoSelection(file);
});

// Drag and drop handling
['dragenter', 'dragover'].forEach(eventName => {
  uploadDropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    uploadDropArea.classList.add("border-orange-500", "bg-orange-100/50");
  });
});

['dragleave', 'drop'].forEach(eventName => {
  uploadDropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    uploadDropArea.classList.remove("border-orange-500", "bg-orange-100/50");
  });
});

uploadDropArea.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  handlePhotoSelection(file);
});

function handlePhotoSelection(file) {
  if (!file) return;

  // Validate format (image/jpeg, image/png, image/jpg)
  const validTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (!validTypes.includes(file.type)) {
    showPhotoError("कृपया फक्त JPG किंवा PNG इमेज निवडा.");
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showPhotoError("फोटोचा आकार खूप मोठा आहे (कमाल 5MB पर्यंत चालेल).");
    return;
  }

  photoError.classList.add("hidden");
  selectedFile = file;

  // Read preview & dataURL
  const reader = new FileReader();
  reader.onload = (event) => {
    currentImageDataUrl = event.target.result;
    photoPreviewImg.src = currentImageDataUrl;
    photoName.textContent = file.name;
    photoSize.textContent = `${(file.size / 1024).toFixed(1)} KB`;

    uploadPrompt.classList.add("hidden");
    photoPreviewContainer.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

removePhotoBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  selectedFile = null;
  currentImageDataUrl = "";
  photoInput.value = "";
  photoPreviewImg.src = "";
  uploadPrompt.classList.remove("hidden");
  photoPreviewContainer.classList.add("hidden");
});

function showPhotoError(msg) {
  photoError.textContent = msg;
  photoError.classList.remove("hidden");
  selectedFile = null;
  currentImageDataUrl = "";
}

// Input sanitation for 10-digit mobile number
mobileInput.addEventListener("input", (e) => {
  // Allow only digits
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
  if (e.target.value.length === 10) {
    mobileError.classList.add("hidden");
  }
});

fullNameInput.addEventListener("input", () => {
  if (fullNameInput.value.trim().length >= 3) {
    nameError.classList.add("hidden");
  }
});

// =============================================================================
// 6. HELPER FUNCTIONS: UNIQUE ID & DATE FORMATTING
// =============================================================================
function generateUniqueMemberId() {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `AGM-${randomNum}`;
}

const marathiMonths = [
  "जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून", 
  "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"
];

function getFormattedMarathiDate(dateObj = new Date()) {
  const day = dateObj.getDate();
  const month = marathiMonths[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day} ${month} ${year}`;
}

// =============================================================================
// 7. DUPLICATE CHECK & FIRESTORE QUERY
// =============================================================================
async function checkDuplicateMobile(mobile) {
  if (isFirebaseLive && db) {
    try {
      const membersRef = collection(db, "members");
      const q = query(membersRef, where("mobile", "==", mobile));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { isDuplicate: true, data: doc.data() };
      }
      return { isDuplicate: false };
    } catch (err) {
      console.error("Firestore duplicate check error:", err);
      // Fallback check in local cache if offline
      const local = getLocalMembers().find(m => m.mobile === mobile);
      if (local) return { isDuplicate: true, data: local };
      return { isDuplicate: false };
    }
  } else {
    // Local demo simulation check
    const members = getLocalMembers();
    const existing = members.find(m => m.mobile === mobile);
    if (existing) {
      return { isDuplicate: true, data: existing };
    }
    return { isDuplicate: false };
  }
}

// =============================================================================
// 8. FIREBASE STORAGE PHOTO UPLOAD
// =============================================================================
async function uploadPhotoToStorage(file, uniqueId) {
  if (isFirebaseLive && storage) {
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const storagePath = `member_photos/${uniqueId}_${Date.now()}_${sanitizedName}`;
      const photoRef = ref(storage, storagePath);
      
      const snapshot = await uploadBytes(photoRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("Firebase Storage Upload Error:", error);
      // If storage fails (e.g. security rules or quota), fallback to dataURL
      return currentImageDataUrl;
    }
  } else {
    // In demo mode, use the direct base64 data URL
    return currentImageDataUrl;
  }
}

// =============================================================================
// 9. FORM SUBMISSION HANDLER
// =============================================================================
membershipForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = fullNameInput.value.trim();
  const mobile = mobileInput.value.trim();

  // Validate Full Name
  if (name.length < 3) {
    nameError.classList.remove("hidden");
    fullNameInput.focus();
    return;
  } else {
    nameError.classList.add("hidden");
  }

  // Validate 10-digit Mobile Number (Indian mobile format starting with 6, 7, 8, 9)
  const mobileRegex = /^[6-9]\d{9}$/;
  if (!mobileRegex.test(mobile)) {
    mobileError.classList.remove("hidden");
    mobileInput.focus();
    return;
  } else {
    mobileError.classList.add("hidden");
  }

  // Validate Photo Upload
  if (!selectedFile || !currentImageDataUrl) {
    photoError.classList.remove("hidden");
    return;
  } else {
    photoError.classList.add("hidden");
  }

  // Start submission state
  setLoadingState(true);

  try {
    // STEP 1: Duplicate Entry Prevention
    const duplicateCheck = await checkDuplicateMobile(mobile);

    if (duplicateCheck.isDuplicate) {
      setLoadingState(false);
      duplicateFoundRecord = duplicateCheck.data;
      showDuplicateModal();
      return;
    }

    // STEP 2: Unique Member ID & Formatting
    const uniqueId = generateUniqueMemberId();
    const formattedDate = getFormattedMarathiDate();
    const currentDate = new Date().toISOString();

    // STEP 3: Upload Photo to Firebase Storage
    const photoUrl = await uploadPhotoToStorage(selectedFile, uniqueId);

    // STEP 4: Store Member Record in Firestore
    const memberRecord = {
      name: name,
      mobile: mobile,
      photoUrl: photoUrl,
      uniqueId: uniqueId,
      registrationDate: formattedDate,
      createdAt: isFirebaseLive ? serverTimestamp() : currentDate
    };

    if (isFirebaseLive && db) {
      try {
        await addDoc(collection(db, "members"), memberRecord);
        console.log("✅ Member saved to Firestore successfully!");
      } catch (firestoreError) {
        console.warn("Firestore save warning, caching locally:", firestoreError);
        saveLocalMember({ ...memberRecord, createdAt: currentDate });
      }
    } else {
      saveLocalMember({ ...memberRecord, createdAt: currentDate });
    }

    // STEP 5: Prepare Member Data for HD Certificate
    lastGeneratedMember = {
      name: name,
      mobile: mobile,
      photoUrl: currentImageDataUrl || photoUrl, // Use local dataURL for 100% reliable CORS-free html2canvas rendering
      uniqueId: uniqueId,
      date: formattedDate
    };

    // STEP 6: Celebrate & Generate Certificate
    triggerConfetti();
    await generateAndDownloadCertificate(lastGeneratedMember);

    // Show Success Card & Reset Form
    successCard.classList.remove("hidden");
    membershipForm.reset();
    selectedFile = null;
    currentImageDataUrl = "";
    uploadPrompt.classList.remove("hidden");
    photoPreviewContainer.classList.add("hidden");

    // Scroll to success banner smoothly
    successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

  } catch (err) {
    console.error("Submission failed:", err);
    alert("काहीतरी त्रुटी झाली, कृपया पुन्हा प्रयत्न करा.");
  } finally {
    setLoadingState(false);
  }
});

function setLoadingState(isLoading) {
  if (isLoading) {
    submitBtn.disabled = true;
    submitBtn.classList.add("opacity-80", "cursor-wait");
    btnText.classList.add("hidden");
    btnSpinner.classList.remove("hidden");
  } else {
    submitBtn.disabled = false;
    submitBtn.classList.remove("opacity-80", "cursor-wait");
    btnText.classList.remove("hidden");
    btnSpinner.classList.add("hidden");
  }
}

// =============================================================================
// 10. DUPLICATE POPUP MODAL HANDLERS
// =============================================================================
function showDuplicateModal() {
  duplicateModal.classList.remove("hidden");
}

function closeDuplicateModal() {
  duplicateModal.classList.add("hidden");
}

closeDuplicateModalBtn.addEventListener("click", closeDuplicateModal);
duplicateModal.addEventListener("click", (e) => {
  if (e.target === duplicateModal) closeDuplicateModal();
});

duplicateViewBtn.addEventListener("click", () => {
  closeDuplicateModal();
  if (duplicateFoundRecord) {
    openCertificateModalForMember(duplicateFoundRecord);
  }
});

// =============================================================================
// 11. HD CERTIFICATE GENERATION USING html2canvas
// =============================================================================
async function generateAndDownloadCertificate(memberData, triggerAutoDownload = true) {
  // Update Certificate HTML DOM fields
  certMemberName.textContent = memberData.name;
  certMemberId.textContent = memberData.uniqueId || "AGM-XXXXXX";
  certMemberMobile.textContent = `+91 ${memberData.mobile}`;
  certMemberDate.textContent = memberData.date || memberData.registrationDate || getFormattedMarathiDate();
  certMemberPhoto.src = memberData.photoUrl;

  // Allow image to load into DOM before rendering
  await new Promise((resolve) => {
    if (certMemberPhoto.complete) {
      resolve();
    } else {
      certMemberPhoto.onload = resolve;
      certMemberPhoto.onerror = resolve;
    }
  });

  try {
    // Generate high resolution canvas (scale: 2 gives 2000x1400 HD print quality)
    const canvas = await html2canvas(hdCertificateTemplate, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#fffdf5",
      logging: false
    });

    const dataUrl = canvas.toDataURL("image/png");

    // Populate preview container
    certPreviewOutput.innerHTML = `
      <img src="${dataUrl}" alt="Certificate Preview" class="w-full h-auto rounded-lg shadow-md cursor-pointer" id="renderedCertImg">
    `;

    // Automatic download trigger
    if (triggerAutoDownload) {
      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      const fileNameSafeName = memberData.name.replace(/\s+/g, "_");
      downloadLink.download = `Aadesh_Group_Malfa_Certificate_${fileNameSafeName}_${memberData.uniqueId}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }

    return dataUrl;
  } catch (err) {
    console.error("Certificate Generation Error:", err);
    throw err;
  }
}

// =============================================================================
// 12. CERTIFICATE PREVIEW MODAL & ACTIONS
// =============================================================================
async function openCertificateModalForMember(member) {
  certificateModal.classList.remove("hidden");
  certPreviewOutput.innerHTML = `
    <div class="p-8 text-center text-gray-400">
      <i class="fa-solid fa-spinner fa-spin text-3xl text-orange-500"></i>
      <p class="text-xs text-gray-600 font-semibold mt-2">प्रमाणपत्र तयार होत आहे...</p>
    </div>
  `;

  lastGeneratedMember = member;
  await generateAndDownloadCertificate(member, false);
}

viewCertificateBtn.addEventListener("click", () => {
  if (lastGeneratedMember) {
    openCertificateModalForMember(lastGeneratedMember);
  }
});

closeCertModalBtn.addEventListener("click", () => {
  certificateModal.classList.add("hidden");
});

certificateModal.addEventListener("click", (e) => {
  if (e.target === certificateModal) {
    certificateModal.classList.add("hidden");
  }
});

downloadAgainBtn.addEventListener("click", async () => {
  if (lastGeneratedMember) {
    await generateAndDownloadCertificate(lastGeneratedMember, true);
  }
});

// WhatsApp Share Handler
function shareOnWhatsApp(member) {
  if (!member) return;
  const message = `🚩 *आदेश ग्रुप, मलफा (श्री गणेश उत्सव मंडळ)* 🚩%0A%0Aमी आदेश ग्रुप, मलफा चा अधिकृत सभासद झालो आहे!%0A👤 नाव: ${encodeURIComponent(member.name)}%0A🆔 सभासद ID: ${member.uniqueId}%0A📅 तारीख: ${encodeURIComponent(member.date || member.registrationDate || '')}%0A%0Aगणपती बाप्पा मोरया, मंगलमूर्ती मोरया! 🌸`;
  const whatsappUrl = `https://wa.me/?text=${message}`;
  window.open(whatsappUrl, "_blank");
}

shareWhatsAppBtn.addEventListener("click", () => {
  shareOnWhatsApp(lastGeneratedMember);
});

modalShareBtn.addEventListener("click", () => {
  shareOnWhatsApp(lastGeneratedMember);
});

// =============================================================================
// 13. SEARCH EXISTING CERTIFICATE LOGIC
// =============================================================================
searchMobile.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
  searchError.classList.add("hidden");
});

searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const mobile = searchMobile.value.trim();

  if (mobile.length !== 10) {
    searchError.textContent = "कृपया अचूक १० अंकी मोबाईल नंबर टाका.";
    searchError.classList.remove("hidden");
    return;
  }

  searchBtnText.classList.add("hidden");
  searchBtnSpinner.classList.remove("hidden");
  searchSubmitBtn.disabled = true;

  try {
    const result = await checkDuplicateMobile(mobile);

    if (result.isDuplicate && result.data) {
      searchError.classList.add("hidden");
      openCertificateModalForMember(result.data);
    } else {
      searchError.textContent = "हा मोबाईल नंबर नोंदणीकृत नाही. कृपया प्रथम नवीन नोंदणी करा.";
      searchError.classList.remove("hidden");
    }
  } catch (err) {
    console.error("Search error:", err);
    searchError.textContent = "शोधताना समस्या आली, कृपया पुन्हा प्रयत्न करा.";
    searchError.classList.remove("hidden");
  } finally {
    searchBtnText.classList.remove("hidden");
    searchBtnSpinner.classList.add("hidden");
    searchSubmitBtn.disabled = false;
  }
});

// =============================================================================
// 14. FESTIVE CONFETTI CELEBRATION
// =============================================================================
function triggerConfetti() {
  if (typeof confetti === "function") {
    // Saffron, Gold, Red celebration colors
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ea580c', '#f59e0b', '#dc2626', '#fbbf24', '#ffffff']
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ea580c', '#f59e0b', '#dc2626', '#fbbf24']
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ea580c', '#f59e0b', '#dc2626', '#fbbf24']
      });
    }, 250);
  }
}
