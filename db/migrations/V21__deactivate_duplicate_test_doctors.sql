-- Deactivate duplicate active doctor records in the database, preserving the primary active doctor for each department
UPDATE doctor
SET active = false
WHERE doctor_id IN (
    SELECT doctor_id FROM (
        SELECT doctor_id,
               ROW_NUMBER() OVER (
                   PARTITION BY lower(trim(full_name)), department_id 
                   ORDER BY 
                       CASE WHEN user_id IN (SELECT user_id FROM app_user WHERE email NOT LIKE '%careflow.local%') THEN 0 ELSE 1 END,
                       doctor_id
               ) as rn
        FROM doctor
        WHERE active = true
    ) sub
    WHERE rn > 1
);
