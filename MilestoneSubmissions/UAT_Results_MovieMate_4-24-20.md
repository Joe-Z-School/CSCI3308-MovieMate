User Acceptance Testing (UAT) Results Report
Project Name: MovieMate
Team Name: 011-8
Date Conducted: 04/24/2025
Testers: Neha Ramachandra

1. Executive Summary
Total Test Cases	Passed	Failed
16      	       	16	    0       
Overall Status: ✅ Passed / ❌ Failed (with Critical Issues) / ⚠️ Passed with Minor Issues

Key Findings:

User could be notified of more restrictions on their inputs. 

2. Detailed Test Results
Feature 1: Account Registration

Test Case ID	Description	    Expected Result	    Pass/Fail	Remarks
UAT-REG-01	    User enters valid info (First Name, Last Name, Username, Password, Email, Profile Icon, Bio)	Account created; redirected to profile page	✅ Passed	-
UAT-REG-02	    User tries to register with an existing username	Error message: "Username already taken"	⚠️ Passed with Minor Issues     Bug #1
UAT-REG-03	    User leaves required fields blank (Username, Password, Email, First Name, Last Name)	Error message listing missing fields	✅ Passed	-
UAT-REG-04	    User inputs invalid email (e.g., "user@invalid")	Error: "Valid email required"	✅ Passed   -
UAT-REG-05	    User enters a username >50 characters	Error: "Max 50 characters allowed"	⚠️ Passed with Minor Issues     Bug #1
UAT-REG-06	    All correct data entered	Verify database entry (users table)	    ✅ Passed	

Bugs/Issues:
Bug #1: Error mesage displayed on console but not on page

Feature 2: Managing User Watch List
Test Case ID	Description	Expected Result	Pass/Fail	Remarks
UAT-WL-01	User adds a movie to Watch List	Confirmation message; movie appears in list	    ✅ Passed	-
UAT-WL-02	User removes a movie from Watch List	Confirmation message; movie removed	    ✅ Passed	-
UAT-WL-03	User tries to add a duplicate movie	Error: "Movie already in Watch List"	✅ Passed	-
UAT-WL-04	User adds multiple movies consecutively	All movies appear in Watch List	    ✅ Passed	-
UAT-WL-05	Verify database consistency after adding	Check watch_list table	    ✅ Passed	-
Bugs/Issues:

Feature 3: Creating a Post
Test Case ID	Description	Expected Result	Pass/Fail	Remarks
UAT-POST-01	User enters valid title & body	Post appears on profile	    ✅ Passed	-
UAT-POST-02	User leaves title/body empty	Error: "Required fields missing"	✅ Passed	-
UAT-POST-03	Title >100 characters	Error: "Title too long"	    ✅ Passed	-
UAT-POST-04	User inputs SQL injection	Post rejected, no DB entry    ✅ Passed	    -
UAT-POST-05	Session expires before submission	Prompt: "Please sign in again"	 ✅ Passed  
Bugs/Issues:


3. Defect Log
Bug ID	Description	Severity (High/Medium/Low)	Steps to Reproduce	Status (Open/Fixed)
#1      Low     Input incorrect information or long strings     Open

4. Environment Details
OS: [Windows]

Browser: [Chrome]

Device: [Desktop/Mobile]

Database: [PostgreSQL]

5. Tester Feedback
Positive Feedback:

"Registration flow and post creation is intuitive"

Improvement Suggestions:

"Login time occasionally takes longer"

6. Sign-Off
Approval Status:

✅ Approved (All critical tests passed).

Approved By:

Neha Ramachandra – 4/24/2025