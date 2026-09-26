# आदेश ग्रुप, मलफा (श्री गणेश उत्सव मंडळ)
## अधिकृत सभासद नोंदणी व डिजिटल HD प्रमाणपत्र प्रणाली

हे एक पूर्ण, सिंगल-पेज, **Mobile-First Web Application** आहे, जे विशेषतः **आदेश ग्रुप, मलफा (श्री गणेश उत्सव मंडळ)** च्या सभासद नोंदणीसाठी तयार करण्यात आले आहे.

---

### ✨ मुख्य वैशिष्ट्ये (Key Features)

1. **📱 मोबाईल-फर्स्ट डिझाईन (Mobile-First Responsive Design)**:
   - Tailwind CSS द्वारे स्मार्टफोन व टॅब्लेटसाठी पूर्णतः ऑप्टिमाइझ केलेले लेआउट.
   - मनमोहक भारतीय सण थीम (भगवा/नारंगी, हळद-पिवळा, सोनेरी व लाल रंगछटा).
   - देवनागरी (मराठी) फॉन्ट डिझाईन, गणेशाय नमः श्लोक, तोरण आणि गुगल फॉन्ट सपोर्ट.

2. **📝 सभासद नोंदणी फॉर्म (Membership Registration Form)**:
   - **पूर्ण नाव (Full Name)**
   - **मोबाईल नंबर (10 Digits Mobile Number)** (व्हॅलिडेशनसह)
   - **फोटो अपलोड (Member Photo)**: गॅलरी किंवा थेट मोबाईल कॅमेऱ्याने सेल्फी (JPG/PNG स्वरूप) आणि लाईव्ह प्रिव्ह्यू.

3. **🛡️ डुप्लिकेट नोंदणी प्रतिबंध व फायरबेस इंटिग्रेशन (Duplicate Prevention & Backend)**:
   - फायरबेस **Cloud Firestore** आणि **Firebase Storage** (Modular Web SDK v9+) सह थेट जोडणी.
   - फॉर्म सबमिट करण्यापूर्वी मोबाईल नंबर आधीपासून `members` कलेक्शनमध्ये आहे का ते तपासले जाते.
   - **डुप्लिकेट आढळल्यास**: लगेच `⚠️ या मोबाईल नंबरवरून आधीच नोंदणी झालेली आहे!` असा स्पष्ट अलर्ट पॉपअप दिसतो व फॉर्म थांबवला जातो.
   - **नवीन असल्यास**: फोटो Firebase Storage मध्ये सुरक्षितपणे अपलोड होतो आणि सभासदाची नोंदणी (नाव, मोबाईल, फोटो URL, तारीख, युनिक आयडी) Firestore मध्ये जतन होते.

4. **🎖️ स्वयंचलित HD प्रमाणपत्र डाऊनलोड (Automatic HD Certificate Download)**:
   - यशस्वी नोंदणीनंतर लगेच **HD Membership Certificate** जनरेट होते.
   - प्रमाणपत्रावरील तपशील:
     - शीर्षक: **"आदेश GROUP, MALFA" - श्री गणेश उत्सव मंडळ**
     - सभासदाचे नाव (Full Name)
     - सभासदाचा फोटो (Member Photo)
     - युनिक सभासद क्रमांक (उदा. `AGM-849201`)
     - नोंदणी तारीख व अधिकृत डिजिटल मोहोर
     - पारंपारिक सोनेरी बॉर्डर व श्री गणेश श्लोक
   - `html2canvas` द्वारे हाय-डेफिनिशन इमेज तयार होऊन थेट मोबाईलमध्ये **Auto-Download** होते.
   - थेट व्हॉट्सॲपवर (WhatsApp) शेअर करण्याची सुविधा.

5. **🔍 आधीच नोंदणी केलेले प्रमाणपत्र शोधा (Find Existing Certificate)**:
   - आधी नोंदणी केलेल्या सभासदांना त्यांचा १० अंकी मोबाईल नंबर टाकून त्यांचे प्रमाणपत्र पुन्हा पाहता व डाऊनलोड करता येते.

---

### 🚀 फायरबेस सेटअप कसा करावा? (Firebase Setup Guide)

#### १. `app.js` मध्ये तुमची फायरबेस की (firebaseConfig) टाका:
[app.js](file:///home/harshal-patil/Desktop/ganpatiiii/app.js#L27-L35) उघडा आणि खालीलप्रमाणे तुमची प्रोजेक्ट की टाका:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef..."
};
```

> **टीप**: जर की टाकल्या नाहीत तरीही हे ॲप्लिकेशन **डेमो/ऑफलाइन मोड** मध्ये लगेच काम करते, जेणेकरून तुम्ही संपूर्ण कार्यप्रणाली लगेच टेस्ट करू शकता!

#### २. Firestore Database Rules:
Firebase Console > Firestore Database > Rules मध्ये जाऊन खालील नियम पेस्ट करा:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /members/{memberId} {
      allow read, write: if true; // उत्पादनासाठी आवश्यकतेनुसार कस्टमाइझ करू शकता
    }
  }
}
```

#### ३. Firebase Storage Rules:
Firebase Console > Storage > Rules मध्ये जाऊन खालील नियम सेट करा:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /member_photos/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

---

### 💻 ॲप स्थानिक पातळीवर (Locally) चालवण्यासाठी:

कोणत्याही लोकल सर्व्हरने `index.html` चालवू शकता. उदाहरणार्थ:

```bash
# पायथन द्वारे लोकल सर्व्हर सुरू करण्यासाठी:
python3 -m http.server 8000
```
त्यानंतर ब्राऊझरमध्ये `http://localhost:8000` उघडा.

---

🚩 **गणपती बाप्पा मोरया, मंगलमूर्ती मोरया!** 🚩
