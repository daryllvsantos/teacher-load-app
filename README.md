# 🖥️ Running This App Locally (No Developer Experience Required)

This guide explains how to run this app on your own computer, even if you are **not a developer**.  
No coding knowledge is needed — just follow the steps carefully.

---

## ✅ What You Need (One-Time Setup)

### 1. Install Node.js
Node.js is required to run this app.

👉 Download it here:  
https://nodejs.org

- Choose the **LTS** version (recommended)
- Install it like a normal program (Next → Next → Finish)

💡 After installing, **restart your computer**.

---

### 2. Download the App
You should have received the app as:
- A **ZIP file**, or
- A **folder**

If it’s a ZIP file:
1. Right-click it
2. Click **Extract / Unzip**
3. Remember where the folder is saved (Desktop is easiest)

---

## ▶️ How to Start the App

### Step 1: Open the App Folder
Open the folder that contains the app.

You should see files like:
- `package.json`
- `pages` or `app`
- `public`

---

### Step 2: Open a Command Window

#### Windows
1. Hold **Shift**
2. Right-click inside the folder
3. Click **“Open PowerShell window here”** or **“Open in Terminal”**

#### Mac
1. Right-click the folder
2. Click **“New Terminal at Folder”**  
   *(or open Terminal and drag the folder into it)*

A text window will open — this is normal.

---

### Step 3: Install the App (First Time Only)

In the command window, type the following and press **Enter**:

```bash
npm install
```

⏳ This may take a few minutes.  
You will see lots of text — this is normal.

✅ You only need to do this **once**.

---

### Step 4: Start the App

In the same command window, type the following and press **Enter**:

```bash
npm run dev
```

After a few seconds, you should see something like:

```text
Local: http://localhost:3000
```

---

## 🌐 Open the App in Your Browser

1. Open a web browser (Chrome, Edge, Safari, etc.)
2. Go to:

```
http://localhost:3000
```

🎉 The app should now be running!

---

## ⛔ Stopping the App

When you are done using the app:
1. Go back to the command window
2. Press **Ctrl + C**
3. Close the window

---

## 🔁 Next Time You Use the App

Next time, you only need to:
1. Open the app folder
2. Open the command window
3. Run:

```bash
npm run dev
```

(No need to run `npm install` again.)

---

## ❓ Common Problems

### “npm is not recognized” (Windows)
- Node.js is not installed, or
- The computer was not restarted after installing Node.js

👉 Reinstall Node.js and restart your computer.

---

### The page does not load
- Make sure the command window is still open
- Make sure `npm run dev` is still running
- Try refreshing the browser

---

## 🆘 Need Help?
If something goes wrong:
- Copy the error message, or
- Take a screenshot

…and send it to the person who gave you this app.
