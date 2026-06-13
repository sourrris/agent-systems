

# Student Management System (SMS)

A simple command-line application for managing students, courses, and enrollments.

## Features
- **Student Management:** Add, list, and delete students.
- **Course Management:** Add, list, and delete courses.
- **Enrollment:** Enroll students in courses and manage grades.
- **Persistence:** Data is stored in a local SQLite database (`sms.db`).
- **Validation:** Prevent enrolling non-existent students into non-existent courses.
- **Interface:** A clean Command Line Interface (CLI) for all operations.

## Installation
1. Clone the repository.
2. Create a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage
Run the application using the `main.py` script:
```bash
python3 main.py
```

### Commands
- `student add <name> <student_id>`: Add a new student.
- `student list`: List all students.
- `student delete <student_id>`: Delete a student by their database ID.
- `course add <title> <course_code>`: Add a new course.
- `course list`: List all courses.
- `course delete <course_id>`: Delete a course by its database ID.
- `enroll <student_id> <course_id> --grade <grade>`: Enroll a student in a course.
