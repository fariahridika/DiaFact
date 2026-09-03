-- Tables for Aiven defaultdb (no CREATE DATABASE)
CREATE TABLE IF NOT EXISTS patients (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  age         INT NOT NULL,
  gender      VARCHAR(10) NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_patient_age CHECK (age BETWEEN 1 AND 120)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS patient_visits (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  patient_id      INT NOT NULL,
  visit_number    INT NOT NULL DEFAULT 1,
  input_features  JSON NOT NULL,
  model_features  JSON NOT NULL,
  risk_score      FLOAT NOT NULL,
  risk_label      VARCHAR(20) NOT NULL,
  risk_percent    FLOAT NOT NULL,
  shap_values     JSON NOT NULL,
  counterfactuals JSON NOT NULL,
  visited_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_visit_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT uq_patient_visit UNIQUE (patient_id, visit_number)
) ENGINE=InnoDB;

CREATE INDEX idx_visits_patient ON patient_visits(patient_id, visit_number);
CREATE INDEX idx_patients_created ON patients(created_at);
