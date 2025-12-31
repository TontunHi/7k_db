# 🌟 Seven Knights Rebirth - โปรเจกต์เว็บไกด์เกม

ยินดีต้อนรับสู่ฐานข้อมูลโค้ดของ **Seven Knights Rebirth**! โปรเจกต์นี้คือเว็บแอปพลิเคชันที่สร้างขึ้นเพื่อช่วยให้ผู้เล่นสามารถพิชิตเกมได้ง่ายขึ้น ด้วยไกด์ที่ละเอียด กลยุทธ์การลง Raid และแนวทางการจัดตัวละคร (Build)

![Banner](https://sgimage.netmarble.com/images/netmarble/tskgb/20250916/ugkq1758004953600.png)

## 📖 เกี่ยวกับโปรเจกต์

แอปพลิเคชันนี้ทำหน้าที่เป็นทั้ง **Public Guide (ไกด์สาธารณะ)** สำหรับผู้เล่นทั่วไป และ **Admin Management System (ระบบหลังบ้าน)** สำหรับผู้ดูแลเนื้อหา ช่วยให้ Admin สามารถอัปเดตกลยุทธ์ การจัดทีม และการจัดของตัวละครได้ง่ายๆ โดยไม่ต้องแตะต้องโค้ด

### ✨ ฟีเจอร์หลัก

*   **🛡️ ระบบจัดการ Raid (Raid Manager)**:
    *   สร้างและจัดการข้อมูลบอส Raid
    *   จัด **รูปแบบทีม (Formation)** ได้หลากหลาย (1-4, 2-3, ฯลฯ)
    *   **[ใหม่]** เลือกระบุ **สัตว์เลี้ยง (Pets)** ที่ใช้ในทีมได้แล้ว! 🐶
    *   กำหนด **ลำดับการใช้สกิล (Skill Priority)** ได้แบบเห็นภาพ

*   **⚔️ ระบบจัดการการจัดของ (Build Manager)**:
    *   ปรับแต่งการใส่ของให้ตัวละคร ทั้ง **อาวุธ (Weapons)**, **เกราะ (Armor)**, และ **เครื่องประดับ (Accessories)**
    *   UI แบบ "Dark Mode" สวยงาม ดูพรีเมียม

*   **🗺️ โหมด Stage & Nightmare**:
    *   ไกด์สำหรับการผ่านด่านต่างๆ
    *   ระบบบันทึกทีมและดูพรีวิวแบบเห็นภาพ

*   **🔐 ระบบ Admin สุดแกร่ง**:
    *   ระบบล็อกอินที่ปลอดภัย
    *   "Dashboard" ที่ใช้งานง่าย เข้าถึงทุกส่วนได้ทันที
    *   **Visual Pickers**: เลือกรูปตัวละคร สัตว์เลี้ยง หรือไอเทม ได้จากรูปภาพ (ไม่ต้องพิมพ์ชื่อไฟล์เอง!)

---

## 🛠️ เทคโนโลยีที่ใช้

สร้างขึ้นโดยเน้นความเรียบง่ายและประสิทธิภาพ:

*   **Backend**: Node.js & Express.js
*   **Frontend**: EJS Templating & Bootstrap 5
*   **Database**: SQLite (เบาและเร็ว)
*   **Styling**: Custom CSS ในธีม "Premium Dark"

---

## 🚀 เริ่มต้นใช้งาน (Getting Started)

ทำตามขั้นตอนง่ายๆ เพื่อรันโปรเจกต์นี้บนเครื่องของคุณ

### สิ่งที่ต้องมี (Prerequisites)

*   **Node.js** (แนะนำเวอร์ชัน 14 ขึ้นไป)
*   **NPM** (Node Package Manager)

### การติดตั้ง (Installation)

1.  **Clone repository** (หรือดาวน์โหลดไฟล์ลงเครื่อง):
    ```bash
    git clone https://github.com/TontunHi/seven-knights-rebirth.git
    ```

2.  **ติดตั้ง Dependencies**:
    ```bash
    npm install
    ```

3.  **รัน Server**:
    ```bash
    npm start
    ```

4.  **เข้าใช้งานเว็บไซต์**:
    *   หน้าแรก: `http://localhost:3000`
    *   หน้า Admin: `http://localhost:3000/admin`

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

ภาพรวมการจัดเก็บไฟล์ในโปรเจกต์:

```
seven_knights_rebirth/
├── 📂 controllers/      # โค้ดส่วน Logic (Raid, Build, Admin)
├── 📂 database/         # ไฟล์ฐานข้อมูล SQLite
├── 📂 public/           # ไฟล์ Static (รูปภาพ, CSS, JS)
│   ├── 📂 images/       # รูป Heroes, Pets, Items, Skills
├── 📂 routes/           # ตัวกำหนด URL เส้นทางต่างๆ
├── 📂 views/            # ไฟล์ Template หน้าเว็บ (EJS)
│   ├── 📂 pages/        # หน้าเว็บหลัก และ Admin
│   └── 📂 partials/     # ส่วนที่ใช้ร่วมกัน (Header/Footer)
└── app.js               # ไฟล์หลักสำหรับเริ่มทำงาน
```

---

## 🤝 การมีส่วนร่วม (Contributing)

หากคุณมีไอเดียดีๆ ที่จะช่วยให้ไกด์นี้ดียิ่งขึ้น:
1.  Fork โปรเจกต์นี้
2.  สร้าง Branch สำหรับฟีเจอร์ของคุณ
3.  Commit การแก้ไข
4.  เปิด Pull Request มาได้เลย!

---

**ขอให้สนุกกับการเล่นเกม!** 🎮
*พัฒนาด้วย ❤️ เพื่อชุมชน Seven Knights*
By Gemeni
