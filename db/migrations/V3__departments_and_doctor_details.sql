ALTER TABLE doctor ADD COLUMN full_name varchar(160) NOT NULL DEFAULT '';
ALTER TABLE doctor ADD COLUMN specialization varchar(120) NOT NULL DEFAULT '';
ALTER TABLE doctor ADD COLUMN license_number varchar(100) UNIQUE;
ALTER TABLE doctor ADD COLUMN experience_years integer NOT NULL DEFAULT 0 CHECK(experience_years >= 0 AND experience_years <= 80);
INSERT INTO department(department_id,name,active,timezone) VALUES
 ('10000000-0000-0000-0000-000000000001','Cardiology',true,'Asia/Kolkata'),
 ('10000000-0000-0000-0000-000000000002','Neurology',true,'Asia/Kolkata'),
 ('10000000-0000-0000-0000-000000000003','Orthopedics',true,'Asia/Kolkata'),
 ('10000000-0000-0000-0000-000000000004','Dermatology',true,'Asia/Kolkata'),
 ('10000000-0000-0000-0000-000000000005','Pediatrics',true,'Asia/Kolkata'),
 ('10000000-0000-0000-0000-000000000006','General Medicine',true,'Asia/Kolkata'),
 ('10000000-0000-0000-0000-000000000007','ENT',true,'Asia/Kolkata'),
 ('10000000-0000-0000-0000-000000000008','Gynecology',true,'Asia/Kolkata');
