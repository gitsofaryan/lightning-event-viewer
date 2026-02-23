<div align="center">
  <h1>⚡ lnprototest Visualizer</h1>
  <p><strong>A Real-time, High-Density Telemetry Dashboard for Lightning Network Protocol Testing</strong></p>
  
  <p>
    <i>Internship Proof of Work • <b>Summer of Bitcoin 2025</b></i><br>
    <i>Organization: <b>lnprototest</b></i><br>
    <i>Developer: <b>Aryan Jain</b></i>
  </p>

  <img src="./assets/dashboard-preview.png" alt="lnprototest Visualizer Dashboard" width="100%">
</div>

---

## 🚀 Overview

The **lnprototest Visualizer** is a specialized engineering tool built to transform the complex, terminal-based logs of the Lightning Network testing suite ([rustyrussell/lnprototest](https://github.com/rustyrussell/lnprototest)) into an intuitive, real-time "Mission Control" visual dashboard. 

Developed as my core Proof of Work for the **Summer of Bitcoin 2025** internship under the **lnprototest** organization, this project bridges the gap between low-level cryptographic protocol testing and high-level visual debugging.

## 🏆 Proof of Work & Core Competencies
This dashboard serves as a showcase of my capabilities as a Full-Stack Protocol Engineer:
- **Protocol Engineering:** Deep understanding of BOLT (Basis of Lightning Technology) specifications, peer-to-peer message flows, and Lightning node behavior.
- **Complex Systems Architecture:** Engineered a robust, asynchronous Python backend (`Flask-SocketIO`, `Eventlet`) to capture and stream real-time raw hex protocol data.
- **Advanced UI/UX Design:** Built a "LeetCode-style," high-density developer dashboard using React and `Zustand`. Features include dynamic, interactive graph visualization using `ReactFlow` and scalable components via AWS Cloudscape.

---

## ✨ Key Features

- **📡 Live Protocol Flow:** A real-time visual graph that maps the interactions between the simulated test runner and target Lightning nodes (e.g., Core Lightning, LDK).
- **📚 BOLT Message Library:** A categorized, click-to-execute catalog of standard Lightning messages (Handshake, Channel Setup, HTLC Payments, and Gossip).
- **🩺 High-Density Telemetry Drawer:** An ultra-compact, auto-scrolling log view that filters out setup noise to focus purely on active packet exchanges, complete with expandable JSON payload inspection.
- **📊 System Metrics:** Live performance counters tracking packet volume, directionality, and message type distributions.
- **🛠️ Raw Injection Engine:** A dedicated JSON playground allowing developers to inject custom, handcrafted protocol sequences directly into the testing runner.

---

## 🛠️ Technology Stack

| Architecture | Core Technologies |
| :--- | :--- |
| **Frontend UI** | React 18, TypeScript, Vite, Tailwind CSS, Zustand |
| **Data Visualization** | ReactFlow (Custom SVGs, dynamic edge routing) |
| **Backend API** | Python 3.12, Flask, Flask-SocketIO, Eventlet |
| **Protocol Engine** | `lnprototest` Python library |

---

## 📥 Installation & Setup

### Requirements
- **Python 3.12+** and **Poetry**
- **Node.js 18+** (or Bun/Yarn)

### 1. Backend Service (Telemetry Streamer)
The backend acts as the bridge by running the `lnprototest` processes and streaming events via WebSockets.
```bash
cd lightning-events
poetry install
poetry run python wsgi.py
```
*(Server listens on `http://127.0.0.1:5000`)*

### 2. Frontend Dashboard (Visualizer)
Access the interactive visualization dashboard.
```bash
cd lnprototest-visualizer
bun install  # (npm install or yarn install)
bun dev      # (npm run dev or yarn dev)
```
*(Dashboard running at `http://localhost:5173`)*

---

<div align="center">
  <p>Engineered with ⚡ by <a href="https://github.com/gitsofaryan">Aryan Jain</a></p>
</div>
