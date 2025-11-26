
User have to login to the system
There are 3 types of users: user, master and admin


Data on user:
* Name
* Adress
* Phone
* e-mail
* Club (There is a list of clubs)
* HWA ID
* Kukkiwon ID

Data on belts:
* Belt 
* Graduation date

For a user it should possible to add, edit and delete a belt. A user can have multiple belts.
The belt is an enum with following values:

* "10. Kup"
* "9. Kup"
* "8. Kup"
* "7. Kup"
* "6. Kup"
* "5. Kup"
* "4. Kup"
* "3. Kup"
* "2. Kup"
* "1. Kup"
* "1. DAN"
* "2. DAN"
* "3. DAN"
* "4. DAN"
* "5. DAN"
* "6. DAN"
* "7. DAN"
* "8. DAN"
* "9. DAN"

A user should be able to register. The user should not be able to set belt, hwa id and kukkiwon id. The user is only able to see their own data.

Master is able to search and see all users.  The master is able to set belt for users of  it's own club and edit data. The master is not able to change club for the user.

Admin is able to edit and search all users.
