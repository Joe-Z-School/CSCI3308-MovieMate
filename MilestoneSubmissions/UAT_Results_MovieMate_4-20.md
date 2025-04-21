User Acceptance Testing (UAT) Results Report
Project Name: MovieMate
Team Name: 011-8
Date Conducted: 04/20/2025
Testers: Neha Ramachandra

1. Executive Summary
Total Test Cases	Passed	Failed	Blocked	Success Rate
16      	       	[XX]	[XX%]
Overall Status: ✅ Passed / ❌ Failed (with Critical Issues) / ⚠️ Passed with Minor Issues

Key Findings:

[Brief summary of major observations, e.g., "Registration flow works but error messages need improvement."]

2. Detailed Test Results
Feature 1: Account Registration

Test Case ID	Description	    Expected Result	    Pass/Fail	Remarks
UAT-REG-01	    User enters valid info (First Name, Last Name, Username, Password, Email, Profile Icon, Bio)	Account created; redirected to profile page	✅ Passed	-
UAT-REG-02	    User tries to register with an existing username	Error message: "Username already taken"	⚠️ Passed with Minor Issues     Error mesage displayed on console but not on page
UAT-REG-03	    User leaves required fields blank (Username, Password, Email, First Name, Last Name)	Error message listing missing fields	✅ Passed	-
UAT-REG-04	    User inputs invalid email (e.g., "user@invalid")	Error: "Valid email required"	❌ Failed	Did not raise an error
UAT-REG-05	    User enters a username >50 characters	Error: "Max 50 characters allowed"	⚠️ Passed with Minor Issues     Error mesage displayed on console but not on page
UAT-REG-06	    All correct data entered	Verify database entry (users table)	    ✅ Passed	

Bugs/Issues:



Feature 2: Managing User Watch List
Test Case ID	Description	Expected Result	Pass/Fail	Remarks
UAT-WL-01	User adds a movie to Watch List	Confirmation message; movie appears in list	    ✅ Passed	-
UAT-WL-02	User removes a movie from Watch List	Confirmation message; movie removed	    ✅ Passed	-
UAT-WL-03	User tries to add a duplicate movie	Error: "Movie already in Watch List"	❌ Failed	Did not raise error
UAT-WL-04	User adds multiple movies consecutively	All movies appear in Watch List	    ⚠️ Passed with Minor Issues	    {Error 1}
UAT-WL-05	Verify database consistency after adding	Check watch_list table	    ✅ Passed	-
Bugs/Issues:
Error 1: Cannot add movie to watchlist by using the top right button on explore page. 
Performance Issue: Delay when removing movies (>5 sec).

Feature 3: Creating a Post
Test Case ID	Description	Expected Result	Pass/Fail	Remarks
UAT-POST-01	User enters valid title & body	Post appears on profile	    ✅ Passed	-
UAT-POST-02	User leaves title/body empty	Error: "Required fields missing"	❌ Failed	-
UAT-POST-03	Title >100 characters	Error: "Title too long"	    ⚠️ Passed with Minor Issues	-
UAT-POST-04	User inputs SQL injection	Post rejected, no DB entry    ✅ Passed	    -
UAT-POST-05	Session expires before submission	Prompt: "Please sign in again"	⚠️ Passed with Minor Issues	   
Bugs/Issues:


3. Defect Log
Bug ID	Description	Severity (High/Medium/Low)	Steps to Reproduce	Status (Open/Fixed)
#123	No duplicate username error	High	1. Register as "admin". 2. Try again.	Open
#125	SQL injection possible	Critical	1. Enter ' OR 1=1 -- in title.	Open
4. Environment Details
OS: [Windows/macOS/Linux]

Browser: [Chrome]

Device: [Desktop/Mobile]

Database: [PostgreSQL]

5. Tester Feedback
Positive Feedback:

"Registration flow and post creation is intuitive"

Improvement Suggestions:

"Error messages should be clearer and displayed to user."

6. Sign-Off
Approval Status:

✅ Approved (All critical tests passed).

⚠️ Conditionally Approved (Minor issues accepted).

❌ Rejected (Critical failures).

Approved By:

Neha Ramachandra – 4/20/2025