# 🌟 Seven Knights Rebirth - Web Guide Project

Welcome to the **Seven Knights Rebirth** codebase! This project is a dedicated web application designed to help players master the game with detailed guides, raid strategies, and character builds.

![Banner](https://sgimage.netmarble.com/images/netmarble/tskgb/20250916/ugkq1758004953600.png)

## 📖 About The Project

This application serves as both a **Public Guide** for players and a powerful **Admin Management System** for content creators. It allows admins to easily update strategies, team compositions, and hero builds without touching the code.

### ✨ Key Features

*   **🛡️ Raid Manager**:
    *   Create and manage raid boss guides.
    *   Set up team compositions with specific **Formations** (1-4, 2-3, etc.).
    *   **[NEW]** Select **Pets** to accompany your raid teams! 🐶
    *   Define **Skill Priority** sequences visually.

*   **⚔️ Build Manager**:
    *   Customize hero builds with **Weapons**, **Armor**, and **Accessories**.
    *   Premium "Dark Mode" UI for selecting items.

*   **🗺️ Stage & Nightmare Modes**:
    *   Guides for specific campaign stages.
    *   Automatic team saving and visual previews.

*   **🔐 Powerful Admin Panel**:
    *   Secure login system.
    *   Intuitive "Dashboard" to access all managers.
    *   **Visual Pickers** for Heroes, Pets, and Items (No more manual text entry!).

---

## 🛠️ Tech Stack

Built with a focus on simplicity and performance:

*   **Backend**: Node.js & Express.js
*   **Frontend**: EJS Templating & Bootstrap 5
*   **Database**: SQLite (Lightweight & Fast)
*   **Styling**: Custom CSS with a "Premium Dark" aesthetic.

---

## 🚀 Getting Started

Follow these simple steps to run the project on your machine.

### Prerequisites

*   **Node.js** (v14 or higher recommended)
*   **NPM** (Node Package Manager)

### Installation

1.  **Clone the repository** (or download files):
    ```bash
    git clone https://github.com/yourusername/seven-knights-rebirth.git
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Start the Server**:
    ```bash
    npm start
    ```

4.  **Access the App**:
    *   Public Home: `http://localhost:3000`
    *   Admin Panel: `http://localhost:3000/admin`

---

## 📂 Project Structure

A quick look at how things are organized:

```
seven_knights_rebirth/
├── 📂 controllers/      # Logic for Raids, Builds, etc.
├── 📂 database/         # SQLite database file
├── 📂 public/           # Static files (Images, CSS, JS)
│   ├── 📂 images/       # Heroes, Pets, Items, Skills
├── 📂 routes/           # URL definitions
├── 📂 views/            # EJS Page Templates
│   ├── 📂 pages/        # Public & Admin pages
│   └── 📂 partials/     # Reusable headers/footers
└── app.js               # Main entry point
```

---

## 🤝 Contributing

Got an idea to make the guide better?
1.  Fork the project.
2.  Create your feature branch.
3.  Commit your changes.
4.  Open a Pull Request!

---

**Happy Gaming!** 🎮
*Developed with ❤️ for the Seven Knights Community.*
