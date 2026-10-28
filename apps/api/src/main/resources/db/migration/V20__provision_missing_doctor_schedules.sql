-- Provision default weekly schedules for any active doctors that currently lack schedule records
INSERT INTO doctor_schedule (schedule_id, doctor_id, day_of_week, starts_at, ends_at, slot_duration_minutes, active, created_at)
SELECT 
    md5(concat('auto-schedule-', d.doctor_id, '-', day, '-', shift.start_time))::uuid,
    d.doctor_id,
    day,
    shift.start_time,
    shift.end_time,
    30,
    true,
    NOW()
FROM doctor d
CROSS JOIN generate_series(1, 6) AS day
CROSS JOIN (VALUES (time '09:00', time '13:00'), (time '14:00', time '17:00')) AS shift(start_time, end_time)
WHERE NOT EXISTS (
    SELECT 1 FROM doctor_schedule s WHERE s.doctor_id = d.doctor_id
) AND d.active = true
ON CONFLICT DO NOTHING;
