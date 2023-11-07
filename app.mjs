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
import {Domains, Managers, CanteenOwners, Students}  from './db.mjs';


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
    res.render('login', {message: req.flash('error'), user:req.params.user}); // Flash message for error (if any)
});

// // Route for rendering the login page
// app.get('/login/manager', (req, res) => {
//     res.render('managerLogin', {message: req.flash('error') }); // Flash message for error (if any)
// });

// // Route for rendering the login page
// app.get('/login/canteen-owner', (req, res) => {
//     res.render('canteenOwnerLogin', { message: req.flash('error') }); // Flash message for error (if any)
// });

// // Route for rendering the login page
// app.get('/login/student', (req, res) => {
//     res.render('studentLogin', { message: req.flash('error') }); // Flash message for error (if any)
// });

// Example login route for managers
app.post('/login/manager', passport.authenticate('manager-local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login/manager',
    failureFlash: true,
  }));
  
  // Example login route for canteen owners
  app.post('/login/canteen-owner', passport.authenticate('canteen-owner-local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login/canteen-owner',
    failureFlash: true,
  }));
  
  // Example login route for students
  app.post('/login/student', passport.authenticate('student-local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login/student',
    failureFlash: true,
  }));

  app.post('/login/admin', passport.authenticate('admin-local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login/admin',
    failureFlash: true,
  }));
  
  
  // Example protected route
  app.get('/dashboard', (req, res) => {
    // Check if the user is authenticated
    if (req.isAuthenticated()) {
      // Render the dashboard for the authenticated user
      res.send('Welcome to the dashboard!');
    } else {
      // Redirect to the login page if not authenticated
      res.redirect('/login/student');
    }
  });

// Define the route for data insertion
app.get('/insert', async (req, res) => {
    try {
      // Sample Insert into Domain Collection
      const domain = await Domains.create({
        name: "School",
      });
  
      // Sample Insert into Manager Collection
      const managerPassword=await hashPassword("hashed_password");
      const manager = await Managers.create({
        username: "john_doe",
        hash: managerPassword,
        domain: domain._id,
      });
  
      // Sample Insert into Canteen Owner Collection
      const canteenOwnerPassword=await hashPassword("hashed_password");
      const canteenOwner = await CanteenOwners.create({
        username: "canteen_owner_1",
        hash: canteenOwnerPassword,
        revenue: 10000,
        price_list: { "item1": 5, "item2": 8 },
        domain: domain._id,
      });
  
      // Sample Insert into Student Collection
      const studentPassword=await hashPassword("hashed_password");
      const student = await Students.create({
        username: "student_1",
        name: "Student One",
        hash: studentPassword,
        balance: 50,
        domain: domain._id,
      });
  
      console.log('Documents inserted successfully');
  
      // Send a response
      res.send('Data inserted successfully!');
    } catch (error) {
      console.error('Error inserting data:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
// // Admin login route
// app.post('/admin/login', async (req, res) => {
//     const { username, password } = req.body;
  
//     try {
//       // Perform admin authentication logic here, for example, checking if it's the admin account
//       if (username === 'admin' && password === 'admin') {
//         res.status(201).json({ message: 'Admin login successful' });
//       } else {
//         res.status(403).json({ error: 'Admin credentials incorrect' });
//       }
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Internal Server Error' });
//     }
//   });


  


app.listen(process.env.PORT || 3000);
