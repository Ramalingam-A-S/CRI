# ClimateRoute Intelligence (CRI) 🌍🚗

An advanced Hyperlocal Climate Risk Engine designed to predict, visualize, and help mitigate climate-related hazards along travel routes. 

Winner / MVP Prototype for the **RECURSION Edition II Hackathon** (Problem Statement: Hyperlocal Climate Risk to Action).

---

## 🚀 The Core Value Proposition

This is **not** an evacuation app, a weather dashboard, or a generic route-optimization tool. 

**ClimateRoute answers one specific question:**
> *"What climate conditions and risks am I likely to encounter along THIS specific travel route, and how will they change over time?"*

When a user selects an Origin, Destination, and Departure Time, CRI:
1. Calculates the **fastest route** and generates **viable safer alternatives**.
2. **Segments** every route into 100-meter chunks.
3. Scores **every single segment** against multiple ML models (Flood, Heat, Landslide, Rain) localized to the exact time the user will arrive at that segment.
4. Explains **why** one route is safer and visually highlights the risks on a Google Maps interface.

---

## 🛠️ Architecture

The prototype is split into two halves:

### 1. The FastAPI Backend (`/backend`)
A high-performance Python backend powering the climate physics and ML models.
*   **Routing Engine**: Connects to Google Directions API for primary routing and falls back to OSRM. Can algorithmically request alternative paths avoiding known coastal/low-lying areas.
*   **Segmentation Engine** (`core/segmentation.py`): Chops routes into 100m chunks. Preserves all intermediate coordinate geometry so frontend polylines perfectly hug actual roads.
*   **Temporal Physics**: Adjusts risks based on departure time (e.g., heat peaks at noon, monsoon rains peak in late afternoon, flood risks lag behind rain).
*   **ML Hazard Models**: Random Forest models trained to predict localized Flood, Heat, and Landslide risks based on geospatial hashes, elevation, slope, and weather.

### 2. The React Frontend (`/frontend`)
A modern, split-screen dashboard built with React, Vite, TailwindCSS, and `@react-google-maps/api`.
*   **Dual Route Visualization**: Renders both the fastest and the recommended alternative route simultaneously on the map.
*   **Risk Coloring**: Translates segment risk levels (LOW, MODERATE, HIGH, SEVERE) into intuitive map colors (Green/Blue, Yellow, Orange, Red) exactly like traffic indicators on Google Maps.
*   **Explainability Cards**: Clicking any segment breaks down exactly *why* it received its risk score (e.g., "+ Rainfall: 50mm, + Elevation: 4m").

---

## ⚙️ How to Run Locally

### Prerequisites
*   Python 3.10+
*   Node.js 18+
*   A Google Maps API Key

### Backend Setup
```bash
cd backend
python -m venv venv
# Windows: .\venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt

# Create a .env file and add your Google Maps API Key
echo "GOOGLE_MAPS_API_KEY=your_api_key_here" > .env

# Run the server
python -m uvicorn main:app --port 8000 --reload
```

### Frontend Setup
```bash
cd frontend
npm install

# Create a .env file and add your Google Maps API Key
echo "VITE_GOOGLE_MAPS_API_KEY=your_api_key_here" > .env

# Run the development server
npm run dev
```

---

## 🧪 Testing the MVP
Once both servers are running, open `http://localhost:3000`:
1. Click on the map to set an **Origin** (e.g., VIT Chennai).
2. Click to set a **Destination** (e.g., Chennai Airport).
3. Set your **Departure Time**.
4. Click **Calculate Safe Routes**.
5. The map will load and evaluate multiple routes, rendering a comparison dashboard recommending the safest path based on hyperlocal climate exposure!

---

*Built with ❤️ for RECURSION Edition II*
