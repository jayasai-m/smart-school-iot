import pymysql

conn = pymysql.connect(host='localhost', user='root', password='abc123', database='smart_school_iot')
cur = conn.cursor()

# Add CV columns (skip if already exist)
cols = [
    ('cv_status', 'VARCHAR(50) NULL'),
    ('cv_notes', 'TEXT NULL'),
    ('cv_confidence', 'FLOAT NULL'),
    ('cv_processed_at', 'DATETIME NULL'),
    ('cv_student_count', 'INT NULL'),
]
for col_name, col_def in cols:
    try:
        cur.execute(f'ALTER TABLE image_submissions ADD COLUMN {col_name} {col_def}')
        print(f'Added column: {col_name}')
    except pymysql.err.OperationalError as e:
        if '1060' in str(e):
            print(f'Column {col_name} already exists, skipping.')
        else:
            raise

# Update school name and headmistress
sql_school = """UPDATE schools SET
  name = 'ZPHS Penamaluru',
  school_code = 'SCH-PENAMALURU-001',
  principal_name = 'Smt. Sudha Rani (Headmistress)',
  hardware_device_id = 'ESP32-PENAMALURU-01',
  hardware_api_key = 'esp32_penamaluru_hw_key_2026'
WHERE name IN ('ZPHS Poranki', 'ZPHS Penamaluru')"""
cur.execute(sql_school)
print(f'Schools updated: {cur.rowcount} row(s)')

# Update user display name
cur.execute("UPDATE users SET full_name = 'ZPHS Penamaluru - Headmistress Sudha Rani' WHERE email = 's1@gmail.com'")
print(f'User updated: {cur.rowcount} row(s)')

conn.commit()

# Verify results
print('\n--- Schools ---')
cur.execute('SELECT id, name, principal_name, school_code FROM schools')
for row in cur.fetchall():
    print(f'  id={row[0]}  name={row[1]}  principal={row[2]}  code={row[3]}')

print('\n--- CV columns in image_submissions ---')
cur.execute("SHOW COLUMNS FROM image_submissions LIKE 'cv_%'")
for row in cur.fetchall():
    print(f'  {row[0]}  {row[1]}')

cur.close()
conn.close()
print('\nAll done.')
