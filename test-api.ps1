Write-Host "=== Testing Student Management API ===" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"

# Test 1: Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/" -Method Get
    Write-Host "   ✅ Status: $($health.status)" -ForegroundColor Green
    Write-Host "   ✅ Using DB: $($health.usingDb)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ API not responding: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Test 2: Get initial data
Write-Host "`n2. Getting initial data..." -ForegroundColor Yellow
try {
    $courses = Invoke-RestMethod -Uri "$baseUrl/courses" -Method Get
    $students = Invoke-RestMethod -Uri "$baseUrl/students" -Method Get
    $grades = Invoke-RestMethod -Uri "$baseUrl/grades" -Method Get
    Write-Host "   ✅ Courses: $($courses.Count)" -ForegroundColor Green
    Write-Host "   ✅ Students: $($students.Count)" -ForegroundColor Green
    Write-Host "   ✅ Grades: $($grades.Count)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to get data: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Create a new student
Write-Host "`n3. Creating new student..." -ForegroundColor Yellow
try {
    $newStudent = Invoke-RestMethod -Uri "$baseUrl/students" -Method Post -Body '{"name":"John Smith","email":"john@email.com","course_id":1}' -ContentType "application/json"
    Write-Host "   ✅ Created student: $($newStudent.name) (ID: $($newStudent.id))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to create student: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Create a new course
Write-Host "`n4. Creating new course..." -ForegroundColor Yellow
try {
    $newCourse = Invoke-RestMethod -Uri "$baseUrl/courses" -Method Post -Body '{"name":"Computer Science"}' -ContentType "application/json"
    Write-Host "   ✅ Created course: $($newCourse.name) (ID: $($newCourse.id))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to create course: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Verify updated data
Write-Host "`n5. Verifying updated data..." -ForegroundColor Yellow
try {
    $students = Invoke-RestMethod -Uri "$baseUrl/students" -Method Get
    $courses = Invoke-RestMethod -Uri "$baseUrl/courses" -Method Get
    Write-Host "   ✅ Now have $($students.Count) students" -ForegroundColor Green
    Write-Host "   ✅ Now have $($courses.Count) courses" -ForegroundColor Green
    
    # Display the data in tables
    Write-Host "`n   Students:" -ForegroundColor Cyan
    $students | Format-Table id, name, email, course_id -AutoSize
    
    Write-Host "   Courses:" -ForegroundColor Cyan
    $courses | Format-Table id, name -AutoSize
    
} catch {
    Write-Host "   ❌ Failed to get updated data: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 All API tests completed!" -ForegroundColor Green
