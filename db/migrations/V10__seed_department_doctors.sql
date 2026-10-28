-- Synthetic development clinicians used to exercise scheduling and booking flows.
WITH seed AS (
  SELECT d.department_id,d.name AS department_name,n,
         md5(concat('seed-user-',d.department_id,'-',n))::uuid AS user_id
  FROM department d CROSS JOIN generate_series(1,5) AS n
)
INSERT INTO app_user(user_id,email,password_hash,status)
SELECT user_id,concat('seed.doctor.',replace(lower(department_name),' ','.'),'.',n,'@careflow.local'),
       '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','ACTIVE'
FROM seed ON CONFLICT DO NOTHING;

WITH seed AS (
  SELECT md5(concat('seed-user-',d.department_id,'-',n))::uuid AS user_id
  FROM department d CROSS JOIN generate_series(1,5) AS n
)
INSERT INTO user_role(user_id,role)
SELECT user_id,'DOCTOR' FROM seed ON CONFLICT DO NOTHING;

WITH seed AS (
  SELECT d.department_id,d.name AS department_name,n,
         md5(concat('seed-user-',d.department_id,'-',n))::uuid AS user_id,
         md5(concat('seed-doctor-',d.department_id,'-',n))::uuid AS doctor_id
  FROM department d CROSS JOIN generate_series(1,5) AS n
)
INSERT INTO doctor(doctor_id,user_id,doctor_number,department_id,verification_status,active,full_name,specialization,license_number,experience_years)
SELECT doctor_id,user_id,concat('DOC-SEED-',substring(replace(doctor_id::text,'-',''),1,12)),department_id,'APPROVED',true,
       (ARRAY['Dr. Ananya Rao','Dr. Arjun Mehta','Dr. Kavya Nair','Dr. Rohan Iyer','Dr. Meera Shah'])[n] || ' (' || department_name || ')',
       CASE department_name WHEN 'ENT' THEN 'Otolaryngology (ENT)' WHEN 'General Medicine' THEN 'Internal Medicine' WHEN 'Gynecology' THEN 'Obstetrics and Gynecology' ELSE department_name END,
       concat('SEED-LIC-',substring(replace(doctor_id::text,'-',''),1,16)),4+n
FROM seed ON CONFLICT DO NOTHING;

WITH seed AS (
  SELECT md5(concat('seed-doctor-',d.department_id,'-',n))::uuid AS doctor_id,n,day
  FROM department d CROSS JOIN generate_series(1,5) AS n CROSS JOIN generate_series(1,6) AS day
)
INSERT INTO doctor_schedule(schedule_id,doctor_id,day_of_week,starts_at,ends_at,slot_duration_minutes,active)
SELECT md5(concat('seed-schedule-',doctor_id,'-',day))::uuid,doctor_id,day,
       CASE WHEN n % 2 = 0 THEN time '13:00' ELSE time '09:00' END,
       CASE WHEN n % 2 = 0 THEN time '17:00' ELSE time '13:00' END,30,true
FROM seed ON CONFLICT DO NOTHING;
