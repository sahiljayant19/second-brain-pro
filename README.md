# 🧠 Second Brain Pro

**Second Brain Pro** is a clean and private note-taking app with AI-powered summarization. It helps you capture ideas, focus on your work with a built-in timer, and see your progress through a simple dashboard. Your notes are saved locally on your browser, so your data never leaves your device.

---

## ✨ Key Features

### 📊 Dashboard
- **Total Stats:** See your note count and most used tags at a glance.
- **Today's Focus:** Automatically highlights your daily tasks.
- **Weekly Report:** Track your productivity and completion rate.

### 🤖 AI-Powered Summarization
- **Real AI Summary:** Generate intelligent summaries using OpenRouter API
- **Node.js Backend:** Fast and secure backend for AI processing
- **Smart Analysis:** Get focus areas, next steps, and concise summaries

### 🧘‍♂️ Focus Mode
- **Distraction-Free:** A centered reading view optimized for focus.
- **Pomodoro Timer:** Built-in timer with custom durations.
- **Immersive UI:** Smooth animations to help you stay in the zone.

### 🔗 Smart Connections
- **Automatic Linking:** Finds related notes based on your content.

### ✍️ Daily Reflections
- **Journaling:** Capture your daily thoughts and learnings.
- **AI Summarizer:** Generate quick summaries of your reflections.

### 🌓 Responsive Design
- **Themes:** Toggle between high-contrast Dark and Light modes.
- **Mobile-First:** Perfectly optimized for phones, tablets, and desktops.

---

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- OpenRouter API key

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd second-brain-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the `backend` directory:
   ```
   PORT=8000
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

4. **Start the backend server**
   ```bash
   cd backend
   node server.js
   ```

5. **Open the frontend**
   Simply open `index.html` in your browser or serve it with a static file server.

---

## 🚀 How to Use

1. **Add Note:** Use the "New Note" button to capture an idea.
2. **Tags:** Use commas (e.g., `work, study`) to categorize your thoughts.
3. **AI Summary:** Click the "Summarize" button on any note to get an AI-generated summary.
4. **Focus:** Click the "Focus" icon on any note to start a deep work session.
5. **Priority:** Star important notes to see them in the Priority view.

---

## ☁️ Deployment

### Frontend (Static)
Deploy the frontend on **Vercel** or any static hosting service:

1. **Push** your code to a GitHub repository.
2. **Connect** the repository to Vercel.
3. **Deploy!** Vercel will automatically detect the `index.html` and host your app.

### Backend (Node.js)
Deploy the backend on platforms like **Render**, **Railway**, or **Heroku**:

1. Set your environment variables in the deployment platform
2. Deploy the `backend` directory
3. Update the frontend API URL in `script.js` to match your backend URL

---

## 🛠️ Technical Details

### Frontend
- **Stack:** Vanilla HTML5, CSS3, and JavaScript
- **Storage:** LocalStorage (Privacy-first for notes)
- **Performance:** Optimized for fast loading

### Backend
- **Stack:** Node.js with Express
- **API:** OpenRouter for AI summarization
- **CORS:** Configured for frontend-backend communication

---

## 🔐 Privacy

- Notes are stored locally in your browser's LocalStorage
- Only the text you want to summarize is sent to the AI API
- No user tracking or data collection

---

*Made for simple and organized note-taking with AI-powered insights.*