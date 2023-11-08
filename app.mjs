import './config.mjs';
import express from 'express'
import session from 'express-session';
import path from 'path'
import bodyParser from 'body-parser'
import { fileURLToPath } from 'url';
import passport from './passport-setup.mjs';
import flash from 'express-flash';
import bcrypt from 'bcrypt';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { Domains, Managers, CanteenOwners, Students } from './db.mjs';


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add session middleware
app.use(session({ secret: process.env.SECRET_KEY, resave: false, saveUninitialized: false }));

// Initialize Passport and restore authentication state, if any, from the session
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// configure templating to hbs
app.set('view engine', 'hbs');


// Function to hash a password
const hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(parseInt(process.env.SALT_ROUNDS));
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        throw error;
    }
};

app.get('/', (req, res) => {
    res.send("Hello World");
});

app.get('/login/:user', (req, res) => {
    res.render('login', { message: req.flash('error'), user: req.params.user }); // Flash message for error (if any)
});


// Example login route for managers
app.post('/login/manager', (req, res, next) => {
    passport.authenticate('manager-local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            // Handle authentication failure, e.g., redirect to login page
            return res.redirect('/login/manager');
        }

        // Set the redirect path dynamically based on the user's domain
        const redirectPath = `/${user.domain.name}/manager/dashboard`;

        // Authenticate the user and redirect
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect(redirectPath);
        });
    })(req, res, next);
});


// Example login route for canteen owners
app.post('/login/canteen-owner', (req, res, next) => {
    passport.authenticate('canteen-owner-local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            // Handle authentication failure, e.g., redirect to login page
            return res.redirect('/login/canteen-owner');
        }

        // Set the redirect path dynamically based on the user's domain
        const redirectPath = `/${user.domain.name}/canteen-owner/dashboard`;

        // Authenticate the user and redirect
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect(redirectPath);
        });
    })(req, res, next);
});

// Example login route for students
app.post('/login/student', (req, res, next) => {
    passport.authenticate('student-local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            // Handle authentication failure, e.g., redirect to login page
            req.flash('error', info.message);
            return res.redirect('/login/student');
        }

        // Set the redirect path dynamically based on the user's domain
        const redirectPath = `/${user.domain.name}/student/dashboard`;

        // Authenticate the user and redirect
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect(redirectPath);
        });
    })(req, res, next);
});

app.post('/login/admin', passport.authenticate('admin-local', {
    successRedirect: '/admin/listdomains',
    failureRedirect: '/login/admin',
    failureFlash: true,
}));


// Example protected route
app.get('/:domain/:role/dashboard', (req, res) => {
    // Check if the user is authenticated
    if (req.isAuthenticated()) {
        // Render the dashboard for the authenticated user
        res.send(`Hello ${req.user.role}`);
    } else {
        // Redirect to the login page if not authenticated
        res.redirect('/login/student');
    }
});

app.get('/admin/createdomain', (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.redirect('/login/admin');
    }
    res.render('admin', {createDomain: true});
});

app.post('/admin/createdomain', async (req, res) => {
    try {
      const { domainName, managerUsername, managerPassword } = req.body;
  
      // Check if the manager username is already in use
      // Check if the manager username is already in use
      const existingManager = await Managers.findOne({ username: managerUsername });
      if (existingManager) {
        // Render the page again with an error message
        return res.render('admin', { error: 'Manager username is already in use', createDomain: true });
      }
      // create the domain
      const domain = await Domains.create({ name: domainName.toLowerCase()});
      const hashed_password = await hashPassword(managerPassword);
      // Create the manager
      const manager = await Managers.create({
        username: managerUsername,
        hash: hashed_password,
        domain: domain._id,
      });
  
      res.redirect('/admin/listdomains');
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

// Assuming you have Express.js set up
app.get('/admin/listdomains', async (req, res) => {
    try {
        if (!req.isAuthenticated() || req.user.role !== 'admin') {
            return res.redirect('/login/admin');
        }
        // Fetch data from your database
        const managers = await Managers.find().populate('domain');

        // Combine the data into a single object
        const adminData = {
            managers: managers.map(manager => ({
                domainName: manager.domain.name,
                managerUsername: manager.username,
            }))
        };

        // Render the admin page and pass the data object
        res.render('admin', { adminData, createDomain: false});
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/:domain/manager/createCanteenOwner', (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.redirect('/login/manager');
    }
    res.render('manager', { createCanteenOwner: true });
});

app.post('/:domain/manager/createCanteenOwner', (req, res) => {
    const { canteenOwnerUsername, canteenOwnerPassword } = req.body;
    canteenOwners.push({ canteenOwnerUsername, canteenOwnerPassword });
    res.redirect('/manager');
});

app.get('/:domain/manager/createStudent', (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.redirect('/login/manager');
    }
    res.render('manager', { createStudent: true });
});

app.post('/:domain/manager/createStudent', (req, res) => {
    const { studentUsername, studentPassword, studentBalance } = req.body;
    students.push({ studentUsername, studentPassword, studentBalance });
    res.redirect('/manager');
});

app.get('/:domain/manager/viewCanteenOwners', (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.redirect('/login/manager');
    }
    res.render('manager', { viewCanteenOwners: true, canteenOwners });
});

app.get('/:domain/manager/viewStudents', (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.redirect('/login/manager');
    }
    res.render('manager', { viewStudents: true, students });
});

// Define the route for data insertion
// app.get('/insert', async (req, res) => {
//     try {
//         // Sample Insert into Domain Collection
//         const domain = await Domains.create({
//             name: "school",
//         });

//         // Sample Insert into Manager Collection
//         const managerPassword = await hashPassword("hashed_password");
//         const manager = await Managers.create({
//             username: "john_doe",
//             hash: managerPassword,
//             domain: domain._id,
//         });

//         // Sample Insert into Canteen Owner Collection
//         const canteenOwnerPassword = await hashPassword("hashed_password");
//         const canteenOwner = await CanteenOwners.create({
//             username: "canteen_owner_1",
//             hash: canteenOwnerPassword,
//             revenue: 10000,
//             price_list: { "item1": 5, "item2": 8 },
//             domain: domain._id,
//         });

//         // Sample Insert into Student Collection
//         const studentPassword = await hashPassword("hashed_password");
//         const student = await Students.create({
//             username: "student_1",
//             name: "Student One",
//             hash: studentPassword,
//             balance: 50,
//             domain: domain._id,
//         });

//         console.log('Documents inserted successfully');

//         // Send a response
//         res.send('Data inserted successfully!');
//     } catch (error) {
//         console.error('Error inserting data:', error);
//         res.status(500).send('Internal Server Error');
//     }
// });



app.listen(process.env.PORT || 3000);
