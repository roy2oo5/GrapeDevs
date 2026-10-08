# PulseGrid AI

**Predictive Medical Supply Intelligence and Redistribution Platform**

PulseGrid AI is an AI-powered platform designed to help hospitals predict medical supply shortages, reduce inventory wastage, and coordinate the redistribution of essential supplies across a hospital network.

The system combines demand forecasting, inventory intelligence, and constrained optimization to identify potential shortages before they occur and recommend practical interventions.

## Problem Statement

Hospitals often face medical supply shortages while nearby facilities hold excess inventory that may expire before being used.

Traditional inventory management systems primarily track existing stock. They do not adequately predict future demand, anticipate shortages, or coordinate resource allocation across hospitals.

PulseGrid AI addresses these challenges through predictive analytics and intelligent redistribution.

## Key Features

### Core Features

* **Inventory Management:** Track medical supplies, available quantities, inventory batches, and expiry dates across hospitals.
* **Demand Forecasting:** Predict supply requirements for individual hospitals using historical consumption and demand patterns.
* **Shortage Prediction:** Estimate stock-out dates based on predicted demand, available inventory, and supplier lead times.
* **Expiry and Wastage Detection:** Identify supplies likely to expire before consumption.
* **Surplus Identification:** Determine how much inventory a hospital can safely redistribute without affecting its own requirements.
* **Redistribution Optimization:** Recommend feasible transfers between hospitals based on shortages, surplus, transport time, and expiry constraints.
* **Critical Supply Prioritization:** Prioritize hospitals according to shortage urgency, patient load, supply criticality, and available alternatives.
* **Intelligence Dashboard:** Provide a centralized view of inventory, forecasts, shortage risks, expiry risks, and recommended actions.

### Advanced Features

* **Hospital Network Digital Twin:** Simulate outbreaks, demand surges, and supplier disruptions to evaluate their impact on medical supply availability.
* **Privacy-Aware Collaboration:** Enable hospitals to share eligible surplus offers without exposing their complete inventory to other hospitals.
* **Explainable Recommendations:** Explain shortage predictions, prioritization decisions, and redistribution suggestions.
* **Recovery Plan Comparison:** Compare alternative redistribution strategies and their projected impact on shortages and wastage.
* **AI Assistant:** Answer natural-language questions about inventory, future demand, shortage risks, and recommended transfers.
* **Transfer Management:** Support approval, tracking, and reconciliation of inter-hospital transfers.

## System Workflow

1. **Data Collection:** Gather hospital inventory, consumption history, expiry information, patient load, and supplier delivery data.
2. **Demand Forecasting:** Predict future supply requirements for each hospital and medical supply.
3. **Risk Assessment:** Identify potential shortages, unusual consumption patterns, and expiry risks.
4. **Surplus Identification:** Determine available stock that can be safely redistributed.
5. **Redistribution Optimization:** Generate feasible transfer recommendations based on demand, urgency, and operational constraints.
6. **Approval and Execution:** Allow participating hospitals to review and approve proposed transfers.
7. **Impact Analysis:** Compare projected shortages and wastage before and after redistribution.
8. **Continuous Reassessment:** Update predictions and recommendations as inventory and demand conditions change.

## AI and Decision Intelligence

PulseGrid AI uses multiple analytical approaches:

| Component            | Approach                                       |
| -------------------- | ---------------------------------------------- |
| Demand Forecasting   | Machine Learning and Time-Series Forecasting   |
| Anomaly Detection    | Statistical Analysis and Machine Learning      |
| Shortage Prediction  | Forecast-Driven Inventory Simulation           |
| Expiry Risk Analysis | Batch-Level Consumption Simulation             |
| Redistribution       | Constrained Mathematical Optimization          |
| Scenario Analysis    | Predictive Simulation and Optimization         |
| AI Assistant         | Large Language Model with Grounded Data Access |

AI is used to predict demand and identify patterns, while deterministic inventory calculations and optimization ensure that recommended transfers follow defined operational constraints.

## Tech Stack

| Layer            | Technology              |
| ---------------- | ----------------------- |
| Frontend         | React, TypeScript, Vite |
| Styling          | Tailwind CSS, shadcn/ui |
| Visualization    | Recharts                |
| Backend          | Python, FastAPI         |
| Database         | SQLite, SQLAlchemy      |
| Data Processing  | pandas, NumPy           |
| Machine Learning | scikit-learn, LightGBM  |
| Optimization     | OR-Tools / PuLP         |
| AI Assistant     | LLM API                 |
| Testing          | pytest                  |
| Version Control  | Git, GitHub             |

*The stack represents the planned implementation and may evolve during development.*

## Data Requirements

The system uses the following datasets:

* Hospital information and operational capacity
* Medical supply catalog and criticality classifications
* Historical supply consumption
* Batch-level inventory and expiry dates
* Supplier orders and delivery lead times
* Hospital-to-hospital transport information
* Patient load and emergency demand indicators
* Simulated outbreak and supply disruption scenarios

The initial prototype uses synthetic data to demonstrate functionality without exposing real hospital or patient information.

## Privacy and Access Control

PulseGrid AI is designed as a collaborative network where hospitals retain control over their inventory information.

* Hospitals have full access to their own authorized operational data.
* Other hospitals cannot automatically view private inventory details.
* Eligible surplus can be shared through controlled availability offers.
* Network coordinators access information according to defined permissions.
* Inter-hospital transfers require appropriate authorization.
* Patient-identifiable information is not required for the prototype.

## Development Roadmap

### Phase 1 — Foundation and MVP

* [ ] Define database schemas and API contracts
* [ ] Create hospital and medical supply datasets
* [ ] Implement hospital and inventory management
* [ ] Build the initial dashboard
* [ ] Implement baseline shortage and expiry calculations

### Phase 2 — AI Intelligence

* [ ] Prepare historical consumption data
* [ ] Develop and evaluate demand forecasting models
* [ ] Implement demand anomaly detection
* [ ] Integrate forecasts with inventory simulations
* [ ] Generate predicted stock-out dates and expiry risks

### Phase 3 — Redistribution

* [ ] Implement safe surplus identification
* [ ] Define critical supply prioritization rules
* [ ] Build the redistribution optimization engine
* [ ] Validate transfer feasibility
* [ ] Implement projected before-and-after impact analysis

### Phase 4 — Advanced Features

* [ ] Implement scenario simulation
* [ ] Add privacy-aware hospital collaboration
* [ ] Develop explainable recovery recommendations
* [ ] Implement transfer approval workflows
* [ ] Integrate the AI assistant

### Phase 5 — Testing and Deployment

* [ ] Validate forecasting performance
* [ ] Test inventory and optimization constraints
* [ ] Complete frontend-backend integration
* [ ] Prepare the demonstration scenario
* [ ] Deploy the application

## Expected Outcomes

PulseGrid AI aims to demonstrate:

* Earlier identification of potential medical supply shortages.
* Improved visibility into future supply requirements.
* Reduced projected wastage from expiring inventory.
* More efficient and fair redistribution of limited supplies.
* Better coordination between participating hospitals.
* Explainable, data-driven supply management decisions.

## Project Scope

This project is being developed for **Singularity 2026 — Track 2: AI for Medical Supply Intelligence**, as part of a 24-hour AI hackathon.

The initial implementation is a proof of concept using simulated hospital operations. Forecasts, transfer recommendations, and projected improvements are intended for demonstration and require further validation before any real-world healthcare deployment.

## License

License to be determined.
