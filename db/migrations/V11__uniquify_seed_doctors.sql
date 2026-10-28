-- Give every synthetic doctor a distinct identity while preserving relationships.
WITH department_order AS (
  SELECT department_id,row_number() OVER (ORDER BY name)::int AS department_index
  FROM department
), seed AS (
  SELECT d.department_id,d.department_index,n,
         md5(concat('seed-doctor-',d.department_id,'-',n))::uuid AS doctor_id,
         (ARRAY[
           'Dr. Aarav Sharma','Dr. Aditi Menon','Dr. Akash Verma','Dr. Amrita Bose','Dr. Anand Krishnan',
           'Dr. Anika Reddy','Dr. Arjun Kapoor','Dr. Bhavna Joshi','Dr. Charan Patel','Dr. Deepa Nair',
           'Dr. Dev Malhotra','Dr. Divya Iyer','Dr. Farhan Ali','Dr. Gauri Rao','Dr. Harish Bhat',
           'Dr. Ishita Sen','Dr. Jai Prakash','Dr. Janani Kumar','Dr. Kabir Mehta','Dr. Kavitha Pillai',
           'Dr. Kiran Desai','Dr. Lakshmi Narayan','Dr. Madhav Gupta','Dr. Meera Kulkarni','Dr. Mohan Das',
           'Dr. Nandini Shah','Dr. Naveen Rao','Dr. Neha Agarwal','Dr. Nikhil Jain','Dr. Pallavi Singh',
           'Dr. Pranav Nair','Dr. Priya Raman','Dr. Rahul Khanna','Dr. Riya Thomas','Dr. Rohit Sinha',
           'Dr. Sanjana Iyer','Dr. Siddharth Bose','Dr. Sneha Reddy','Dr. Varun Menon','Dr. Zara Khan'
         ])[(d.department_index-1)*5+n] AS full_name
  FROM department_order d CROSS JOIN generate_series(1,5) AS n
)
UPDATE doctor doc
SET full_name=seed.full_name,
    experience_years=3+((seed.department_index-1)*5)+seed.n
FROM seed
WHERE doc.doctor_id=seed.doctor_id;
