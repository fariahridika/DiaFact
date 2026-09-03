# Quarantined artifacts — do not load

These two files were what the app shipped with. They are kept only so the
finding can be reproduced; nothing in the running service reads this folder.

**They were not built from DiaHealth.**

| | `diahealth_processed.pkl` | real DiaHealth |
|---|---|---|
| rows | 5,437 | 5,437 |
| positives | 663 (12.19%) | 344 (6.33%) |
| mean weight | 75.2 kg | 53.6 kg |
| mean BMI | 26.4 | 22.5 |
| rows matching the source CSV | 6 / 5,437 (0.1%) | — |

`diahealth_xgboost.pkl` (300 trees, depth 4) was trained on that data. Scored
on the real DiaHealth test split it gives:

| | quarantined model | published model |
|---|---|---|
| AUC-ROC | 0.674 | 0.820 |
| F1 | 0.187 | 0.377 |
| **Precision** | **0.111** | 0.341 |

Precision 0.111 means roughly nine in ten patients it flagged "High risk"
would have been false positives.

The likely origin is `DiaHealth_Corrected_Dataset.csv`, referenced by the old
`start.bat` and `routes/seed.js` at a hard-coded `M:\thesis\...` path.

The service now builds its own artifacts from the published experiment via
`prepare_artifacts.py`, which refuses to run unless the model reproduces the
paper's Table 1 metrics exactly.
