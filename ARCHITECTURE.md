# System Architecture
`
        WEATHER MODEL
             │
             ▼
     WEATHER FEATURES
             │
             ▼
┌─────────────────────────┐
│ HAZARD-SPECIFIC MODELS  │
└─────────────────────────┘
     │      │      │
     ▼      ▼      ▼
   FLOOD   HEAT  LANDSLIDE
     │      │      │
     └──────┼──────┘
            ▼
      RISK FUSION
            │
            ▼
  HYPERLOCAL RISK ASSESSMENT
            │
            ▼
      FASTAPI BACKEND
            │
            ▼
         FRONTEND
`
