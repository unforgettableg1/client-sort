# Client Sort – Multi-Criteria Sorting with Drag & Drop

A React + TypeScript project that demonstrates a **Client Management UI** with advanced sorting features:

- Add multiple sort criteria (e.g., Name, Created At, Status).
- Reorder sort priority using **drag-and-drop**.
- Toggle between ascending/descending with pill-style buttons.
- Persist criteria in **localStorage** and **URL params**.
- Add new clients via modal (saved locally).
- Responsive UI styled with **TailwindCSS**.

# structure 
client-sort/
 ┣ src/
 ┃ ┣ components/
 ┃ ┃ ┗ ClientList.tsx   # main UI
 ┃ ┣ utils/
 ┃ ┃ ┗ sortUtils.ts     # comparator + helpers
 ┃ ┣ App.tsx
 ┃ ┗ main.tsx
 ┣ public/
 ┣ index.html
 ┣ tailwind.config.cjs
 ┣ postcss.config.cjs
 ┣ tsconfig.json
 ┗ package.json
 
---

## 🛠 Tech Stack

- **React (Vite + TypeScript)**
- **TailwindCSS** for styling
- **@dnd-kit** for drag-and-drop sorting
- **Vitest** for unit tests
- **localStorage** + URL param persistence
- Deployment: **Netlify** / **GitHub Pages**

---

## 📦 Installation & Setup

Clone the repo and install dependencies:

```bash
git clone https://github.com/unforgettableg1/client-sort.git
cd client-sort
npm install
